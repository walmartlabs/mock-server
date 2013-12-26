# Mock Server

Your friendly mock server

Node server that easily allows for development and testing of SPA application running against
production services.

## Features

- Remote Service Proxy
- Local file override of remote proxy
- Mock data sources
- CORS remapping
- Cookie remapping
- Browser live reload

### Server Mode

Server mode allows for setup of simple testing servers that eases the testing process for features
that are currently under development.

- Automated rebuild from github pushes
- Branch selection
- Heroku support
- Campfire notifications

## Setup

1. In the root of the SPA application create _mock-server.json_. See [example](https://github.com/kpdecker/mock-server-meetup/blob/master/mock-server.json).
2. (Optional) Define _package.json_ with build dependencies (lumbar, grunt)
3. Deploy to heroku
  1. `git clone git@github.com:walmartlabs/mock-server.git`
  2. `heroku create`
  3. Setup git repo `heroku config:add MOCK_REPO=repoAddress`

### Private Repository Access

mock-server can be configured to access private git repositories through the `GIT_SSH`, `MOCK_KEY`,
and `MOCK_PUB` environment variables.

```sh
$ heroku config:add \
    GIT_SSH="/app/git_ssh.sh" \
    MOCK_KEY="`cat ~/.ssh/id_rsa`" \
    MOCK_PUB="`cat ~/.ssh/id_rsa.pub`"
```

### Automatic Rebuild

Github automatic updates are achieved through github push receive hooks combined with a
[githubpub](https://github.com/kpdecker/githubpub) publisher.

1. Setup a [githubpub](https://github.com/kpdecker/githubpub) instance or use the public one
2. Add a [webhook](https://help.github.com/articles/post-receive-hooks) to the git repository. This
    should be `http://$server/githubpub/$group`
3. Add PUBNUB variables to mock-server instance

```sh
$ heroku config:add \
    PUBNUB_CHANNEL=channelName \
    PUBNUB_SUBSCRIBE_KEY=subscribeKey
```

#### Public Pubnub Instance

A public gitpubnub instance is available at `https://secure-reef-1619.herokuapp.com/` with. This is
public so conflict may occur between channel names and push events sent through this service may
be read by anyone reading this document. This is not recommended for private project use.

Example web hook: https://secure-reef-1619.herokuapp.com/githubpub/channelName
Subscribe Key: `sub-c-1c0b5d78-eb3e-11e1-9de3-61dd1d151c11`


### Campfire

mock-server uses the same config as the Campfire heroku addon. If enabled mock-server will utilize
the same config as the addon. Otherwise the following environment variables need to be configured.


```sh
$ heroku config:add \
     DEPLOYHOOKS_CAMPFIRE_API_KEY=apiKey \
     DEPLOYHOOKS_CAMPFIRE_ROOM=room \
     DEPLOYHOOKS_CAMPFIRE_SSL=1 \
     DEPLOYHOOKS_CAMPFIRE_URL=campfireServerName
```

In either case these mock-server specific vars need to be set:

- `INSTANCE_NAME` : Name reported in campfire notifications. This can be any value but is generally
    set to the heroku server name.
- `CAMPFIRE_QUIET` : Define to decrease the number of campfire notifications from the instance


### Using other build systems

Mock-server comes with support for node build systems out of the box but any build system may be
used if binaries are available. For more information on how to include additional binaries in the
package, see the [Heroku build pack](https://devcenter.heroku.com/articles/buildpacks)
documentation. Note that mock-server requires the node build pack so running additional build packs
on the sytem will require the use of the [multi](https://github.com/ddollar/heroku-buildpack-multi/)
build pack.

## Example
An example project has been setup [here](https://github.com/kpdecker/mock-server-meetup).


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/walmartlabs/mock-server/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

