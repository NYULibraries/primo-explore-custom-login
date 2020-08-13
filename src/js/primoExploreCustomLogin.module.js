import ngCookies from 'angular-cookies';

angular
  .module('primoExploreCustomLogin', [
    ngCookies,
  ])
  .component('primoExploreCustomLogin', {
    controller: customLoginController,
    require: {
      parentCtrl: '^prmUserAreaExpandable'
    }
  })
  .service('customLoginConfigService', ['primoExploreCustomLoginConfig', function (config) {
    if (!config) {
      console.warn('the constant primoExploreCustomLoginConfig is not defined');
    }

    return Object.freeze(angular.merge({
      timeout: 6000,
      mockUserConfig: {
        delay: 1000,
      }
    }, config));
  }])
  // Injects prmUserAreaExpandable's handleLogin as a global service
  .service('primoExploreCustomLoginService', [
    '$window',
    '$http',
    '$timeout',
    '$cookies',
    'customLoginConfigService',
    primoExploreCustomLoginService
  ]);


const store = {
  user: undefined,
  login: undefined,
  logout: undefined,
  isLoggedIn: undefined,
};

function primoExploreCustomLoginService($window, $http, $timeout, $cookies, config) {
  const svc = this;

  svc.fetchPDSUser = store => {
    store.user = $http.get(`${config.pdsUrl($cookies)}`, {
      timeout: config.timeout,
    })
    .then(response => {
      const user = config.callback(response, $window);
      store.user = user;
      return user;
    });

    return store.user;
  };

  if (config.mockUserConfig && config.mockUserConfig.enabled) {
    // reassigns fetchPDSUser function
    svc.fetchPDSUser = store => {
      const user = config.mockUserConfig.user || {};
      const delayTime = config.mockUserConfig.delay;

      const delay = (t, v) => new Promise((res) => $timeout(res.bind(null, v), t));
      return delay(delayTime, user)
              .then((user) => { store.user = user; return user; });
    };
  }

  return {
    // Written as a function to encapsulate changable login/logout functions
    login: () => store.login(),
    logout: () => store.logout(),
    fetchPDSUser: () => store.user ? Promise.resolve(store.user) : svc.fetchPDSUser(store),
    get isLoggedIn() {
      if (config.mockUserConfig.enabled) {
        // returns mock user's isLoggedIn value strictly if true or false explicitly. Otherwise, use store value.
        return config.mockUserConfig.isLoggedIn === true || (config.mockUserConfig.isLoggedIn === false ? false : store.isLoggedIn);
      }
      return store.isLoggedIn;
    }
  };
}

function customLoginController() {
  const ctrl = this;
  ctrl.$onInit = function () {
    store.login = ctrl.parentCtrl.handleLogin.bind(ctrl.parentCtrl);
    store.logout = ctrl.parentCtrl.handleLogout.bind(ctrl.parentCtrl);
    // Note the parentCtrl changed this function to be called isSignedIn,
    // but we decided to keep it isLoggedIn in our implementation
    store.isLoggedIn = ctrl.parentCtrl.isSignedIn();
  };
}