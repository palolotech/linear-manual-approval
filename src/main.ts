import * as core from '@actions/core'
import {LinearClient, LinearFetch, User} from '@linear/sdk'
import { IssueCreateInput } from '@linear/sdk/dist/_generated_documents'
import {wait} from './wait'



async function getCurrentUser(linearClient : LinearClient): LinearFetch<User> {
  return linearClient.viewer
}

async function run(): Promise<void> {

    const apiKey: string = core.getInput('linear-api-key')
    const linearClient = new LinearClient({apiKey})
    const user = await getCurrentUser(linearClient)
    console.log(`Running as user: ${user}`)

    // This is really hacky, but it works.
    // https://github.com/orgs/community/discussions/25470
    const githubURL = `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`

    const issueTitle = core.getInput('issue-title')
    const issueBody = core.getInput('issue-body') + `\n\n Close the issue to proceed. \n\n [View on GitHub](` + githubURL + `)`
    const teamName = core.getInput('team-name')
    // Timeouts are in milliseconds, inputs are in seconds.
    const pollingInterval = parseInt(core.getInput('polling-interval')) * 1000;
    const startingStatus = core.getInput('starting-status');

    const teams = (await linearClient.teams({filter: { name: {eq: teamName}}})).nodes;
 

    var ticketsTeam = teams.find(team => team.name === teamName);
    if (ticketsTeam === undefined) {
        throw new Error(`${teamName} team not found`);
    }
  
    var linearIssueCreateOptions : IssueCreateInput = {  title: issueTitle, teamId: ticketsTeam.id, description: issueBody }

    console.log("Attempting to set status to " + startingStatus);
    if (startingStatus != "do not set") {
        console.log("Attempting to set status to " + startingStatus);
        const statuses = (await linearClient.workflowStates({ filter: { team: {id: { eq: ticketsTeam.id}}, name: { eq: startingStatus } } })).nodes;
        if (statuses.length == 0) {
            throw new Error(`No workflow state found with name ${startingStatus}`)
        }
        const status = statuses[0]
        console.log(`Setting status to ${status.name} as id ${status.id}`)
        linearIssueCreateOptions.stateId = status.id
    }

    const createdIssue = await linearClient.issueCreate(linearIssueCreateOptions)
    if (createdIssue === undefined) {
        throw new Error('Issue not created');
    }
  
    const issue = await createdIssue.issue;
    if (issue === undefined) {
        throw new Error('Issue not created');
    }

    console.log(`Created issue: ${issue.id} at ${issue.createdAt} located at URL ${issue.url}`)
  
    const issue_id = issue.id;
  
    // Wait until the issue is closed
    while (true) {
        await wait(pollingInterval);
        var updatedIssue = await linearClient.issue(issue_id);
        if (updatedIssue === undefined) {
            continue;
        }
        if (updatedIssue.completedAt !== undefined) {
            break;
        }
    }
}

try {
  run()
} catch (error) {
  if (error instanceof Error) core.setFailed(error.message)
}
