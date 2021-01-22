cordova.define('cordova/plugin_list', function(require, exports, module) {
  module.exports = [
    {
      "id": "cordova-plugin-network-information.network",
      "file": "plugins/cordova-plugin-network-information/www/network.js",
      "pluginId": "cordova-plugin-network-information",
      "clobbers": [
        "navigator.connection",
        "navigator.network.connection"
      ]
    },
    {
      "id": "cordova-plugin-network-information.Connection",
      "file": "plugins/cordova-plugin-network-information/www/Connection.js",
      "pluginId": "cordova-plugin-network-information",
      "clobbers": [
        "Connection"
      ]
    },
    {
      "id": "cordova-plugin-wifi-manager.wifiManager",
      "file": "plugins/cordova-plugin-wifi-manager/www/wifiManager.js",
      "pluginId": "cordova-plugin-wifi-manager",
      "clobbers": [
        "wifiManager"
      ]
    }
  ];
  module.exports.metadata = {
    "cordova-plugin-network-information": "2.0.2",
    "cordova-plugin-whitelist": "1.3.4",
    "cordova-plugin-wifi-manager": "0.3.0"
  };
});