'use strict';

describe('', function() {

  var module;
  var dependencies;
  dependencies = [];

  var hasModule = function(module) {
  return dependencies.indexOf(module) >= 0;
  };

  beforeEach(function() {

  // Get module
  module = angular.module('coreGamesIonicUi');
  dependencies = module.requires;
  });

  it('should load config module', function() {
    expect(hasModule('coreGamesIonicUi.config')).toBeTruthy();
  });



  it('should load interceptors module', function() {
    expect(hasModule('coreGamesIonicUi.interceptors')).toBeTruthy();
  });


  
  it('should load services module', function() {
    expect(hasModule('coreGamesIonicUi.services')).toBeTruthy();
  });
  

});