# primo-explore-custom-login

[![CircleCI](https://circleci.com/gh/NYULibraries/primo-explore-custom-login.svg?style=svg)](https://circleci.com/gh/NYULibraries/primo-explore-custom-login)
[![Coverage Status](https://coveralls.io/repos/github/NYULibraries/primo-explore-custom-login/badge.svg)](https://coveralls.io/github/NYULibraries/primo-explore-custom-login)
[![npm version](https://badge.fury.io/js/primo-explore-custom-login.svg)](https://badge.fury.io/js/primo-explore-custom-login)

## Usage

1. Install
`yarn add primo-explore-custom-login`
2. Add as an angular dependency
```js
let app = angular.module('viewCustom', [
  //... other dependencies
  'primoExploreCustomLogin',
]);
```
3. Add component to `prmAuthenticationAfter`.

This component has no visible effect, but is required in order to 'capture' login functions and other information from the `<prm-authentication>` component.

```js
app
  .component('prmAuthenticationAfter', {
    template: `<primo-explore-custom-login></primo-explore-custom-login>`
  })
```
4. Configure

Set configuration values as an angular constant named `primoExploreCustomLoginConfig`.

```js
app
  .constant('primoExploreCustomLoginConfig', {
    pdsUrl: 'https://pds.library.edu/pds?func=get-attribute&attribute=bor_info',
    //... etc. (see below)
  })
```

## Configuration

|name|type|usage|
|---|---|---|
`pdsUrl`| `function` | A function that takes an angular [`$cookies` service object](https://docs.angularjs.org/api/ngCookies/service/$cookies) and returns url string for the PDS API for getting user information.
`callback` | `function` | A callback function that takes a `response` object and an `$window` object for convenient usage. When the Promise resolves, the return value of `callback` is returned.
`timeout` | `integer` | The time limit before an API fetch fails
`mockUserConfig`| `Object` | Settings for mocking a user (especially for offline development and testing)

## `primoExploreCustomLoginService`

All of the functionality of this module is contained in the `primoExploreCustomLoginService`.

### `fetchPDSUser`

This function is asynchronous and returns an AngularJS Promise (see [$http documentation](https://docs.angularjs.org/api/ng/service/$http))

The first time fetchPDSUser is called, the function fetches the user data via the PDS API (as configured). This value is then cached throughout the user's session within the SPA. Exiting or refreshing the page will require a new PDS API call to get user data.

If within the same session multiple components execute `fetchPDSUser` before the request returns, the promise of the first `$http` request is returned and handled in a similarly asynchronous manner. This means you can safely call `fetchPDSUser` from as many components as you want without worrying about redundate API calls!

Once the user is fetched, subsequent `fetchPDSUser` calls simply return a resolved Promise of the result of your `callback` function.

`fetchPDSUser` relies on the `PDS_HANDLE` cookie value in Primo, so it is imperative that your library and `pds` are on the same domain for the function to properly work.

`mockUserConfig` values will allow you to mock a user, which is especially useful within a devleopment environment; as long as you are logged in, the `fetchPDSUser` function will instead return whatever is set in the `user` value, as long as `enabled` is set to `true`. The `delay` parameter allows you to set a specific amount of time to delay the resolved Promise, to better observe and experiment with delayed API behavior.

```js
// config
app
  .constant('primoExploreCustomLoginConfig', {
    pdsUrl($cookies) {
      return `https://pds.library.edu/pds?func=get-attribute&attribute=bor_info${$cookies.get('PDS_HANDLE')}`
    },
    callback(response, $window) {
      const selectors = ['id', 'bor-status']
      const xml = response.data;
      const getXMLProp = prop => (new $window.DOMParser)
                                    .parseFromString(xml, 'text/xml')
                                    .querySelector(prop).textContent;
      const user = selectors.reduce((res, prop) => ({ ...res, [prop]: getXMLProp(prop) }), {});

      return user;
    },
    timeout: 5000,
    mockUserConfig: {
      enabled: true,
      user: {
        'id': '1234567',
        'bor-status': '55',
      },
      delay: 500,
    }
  })

// controller
myController.$inject = ['primoExploreCustomLoginService'];
function myController(customLoginService) {
  customLoginService.fetchPDSUser()
    .then(function(user) {
      // user is a POJO with properties: id, bor-status. All values are string values.
      if (user['bor-status'] === '20') {
        // do one thing
      } else {
        // do something else
      }
    },
    function(error) {
      console.error(err);
      // do other stuff if the request fails
    })
}
```

### `login`

Action which executes user login (the same that is used the `<prm-authentication>` components).

```js
primoExploreCustomLoginService.login();
```

### `logout`

Action which executes user logout.

```js
primoExploreCustomLoginService.logout();
```

### `isLoggedIn`

Returns a boolean value of whether the user is logged in.

```js
const loggedIn = primoExploreCustomLoginService.isLoggedIn;

if (loggedIn) {
  //...
}
```

## See also
* [primo-explore-custom-requests](https://github.com/NYULibraries/primo-explore-custom-requests) -- Uses this module to customize request options based on patron/user data.
