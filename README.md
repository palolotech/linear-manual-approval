
# Using this action

TL/DR: This action makes a Linear ticket in one of your projects in Backlog state with no
assigned handler (both TODO) at which point they wait until the ticket is closed before proceeding

NOTE: Github Actions jobs time out after 6 hours.  If you want more than that, pay up for Github Enterprise and use their version instead.  

```
- uses: palolotech/linear-manual-approval@main
  with:
    linear-api-key: ${{ secrets.LINEAR_API_KEY }}
    issue-title: This is a test ticket
    issue-body: This is the body of our test ticket
    team-name: Tickets
    # (Optional) in seconds, defaults to 10 seconds
    polling-interval: 10
    # (Optional) Done by name, multiple statuses with same name is undefined behavior
    starting-status: Open  
  ```


# Development and deployment notes (left from the template)

## Code in Main

> First, you'll need to have a reasonably modern version of `node` handy. This won't work with versions older than 9, for instance.

Install the dependencies

```bash
$ pnpm install
```

Build the typescript and package it for distribution

```bash
$ pnpm run build && npm run package
```

Run the tests :heavy_check_mark:

```bash
$ pnpm test

 PASS  ./index.test.js
  ✓ throws invalid number (3ms)
  ✓ wait 500 ms (504ms)
  ✓ test runs (95ms)

...
```

## Change action.yml

The action.yml defines the inputs and output for your action.

Update the action.yml with your name, description, inputs and outputs for your action.

See the [documentation](https://help.github.com/en/articles/metadata-syntax-for-github-actions)


## Publish to a distribution branch

Actions are run from GitHub repos so we will checkin the packed dist folder.

Then run [ncc](https://github.com/zeit/ncc) and push the results:

```bash
$ npm run package
$ git add dist
$ git commit -a -m "prod dependencies"
$ git push origin releases/v1
```

Note: We recommend using the `--license` option for ncc, which will create a license file for all of the production node modules used in your project.

Your action is now published! :rocket:

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

## Validate

You can now validate the action by referencing `./` in a workflow in your repo (see [test.yml](.github/workflows/test.yml))

```yaml
uses: ./
with:
  milliseconds: 1000
```

See the [actions tab](https://github.com/actions/typescript-action/actions) for runs of this action! :rocket:

## Usage:

After testing you can [create a v1 tag](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md) to reference the stable and latest V1 action
