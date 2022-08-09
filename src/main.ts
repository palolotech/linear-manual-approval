import * as core from '@actions/core'
import {LinearClient, LinearFetch, User} from '@linear/sdk'
import {wait} from './wait'



async function getCurrentUser(linearClient : LinearClient): LinearFetch<User> {
  return linearClient.viewer
}

async function run(): Promise<void> {

    const apiKey: string = core.getInput('linear-api-key')
    const linearClient = new LinearClient({apiKey})
    const user = await getCurrentUser(linearClient)
    console.log(`Running as user: ${user}`)

    const teams = (await linearClient.teams()).nodes;

    // This is really hacky, but it works.
    // https://github.com/orgs/community/discussions/25470
    const githubURL = `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`

    const issueTitle = core.getInput('issue-title')
    const issueBody = core.getInput('issue-body') + `\n\n Close the issue to proceed. \n\n [View on GitHub](` + githubURL + `)`

    const teamName = core.getInput('team-name')

    const pollingInterval = parseInt(core.getInput('polling-interval'))

    var ticketsTeam = teams.find(team => team.name === teamName);
    if (ticketsTeam === undefined) {
        throw new Error(`${teamName} team not found`);
    }
  
    const createdIssue = await linearClient.issueCreate({  title: issueTitle, teamId: ticketsTeam.id, description: issueBody })
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
