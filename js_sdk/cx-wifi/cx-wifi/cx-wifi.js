/**
 * 用于wifi连接基于html5 plus开发
 * 
 * by cx 2021-05-17
 */


// 获取wifi 管理
function getWifiManager() {
	// 主窗体
	var MainActivity = plus.android.runtimeMainActivity()
	// 上下文 
	var Context = plus.android.importClass('android.content.Context');

	// 导入WIFI管理 和 WIFI 信息 的class  
	plus.android.importClass("android.net.wifi.WifiManager")
	plus.android.importClass("android.net.wifi.WifiInfo")
	plus.android.importClass("java.util.ArrayList")

	// 获取 WIFI 管理实例  
	return MainActivity.getSystemService(Context.WIFI_SERVICE)
}

/**
 * 设置wifi (可以根据返回status验证是否切换成功)
 * @param {String} ssid
 * @param {String} pwd 密码
 * @return {status:"状态",networkId:"网络id"}
 */
function setWifi(ssid) {
	// 获取定位授权才能得到wifi ssid
	plus.android.requestPermissions(['android.permission.ACCESS_COARSE_LOCATION'], (e) => {
		if (e.granted.length > 0) { //权限被允许
		}
	}, (e) => {
		console.log('Request Permissions error:' + JSON.stringify(e));
	});

	// 获取 WIFI 管理实例  
	let wifiManager = getWifiManager();
	// 打开wifi
	if (!wifiManager.isWifiEnabled()) {
		wifiManager.setWifiEnabled(true);
	}
	let res = createWifiConfig(wifiManager, ssid);
	let cfg = res.config;
	let i = res.netId;
	let b = wifiManager.enableNetwork(i, true);

	// 回收类
	plus.android.autoCollection(cfg);
	plus.android.autoCollection(wifiManager);

	return {
		status: b,
		networkId: i
	};
}

/**
 * 创建wifi配置
 * @param {Object} wifiManager
 * @param {Object} ssid
 * @param {String} pwd 密码
 */
function createWifiConfig(wifiManager, ssid) {
	plus.android.importClass("java.util.BitSet");
	let WifiConfiguration = plus.android.importClass("android.net.wifi.WifiConfiguration");
	let config = new WifiConfiguration();

	plus.android.getAttribute(config, "allowedAuthAlgorithms").clear();
	plus.android.getAttribute(config, "allowedGroupCiphers").clear();
	plus.android.getAttribute(config, "allowedKeyManagement").clear();
	plus.android.getAttribute(config, "allowedPairwiseCiphers").clear();
	plus.android.getAttribute(config, "allowedProtocols").clear();
	plus.android.setAttribute(config, "SSID", `"${ssid}"`);
	//plus.android.setAttribute(config, "preSharedKey", `"${pwd}"`);
	plus.android.setAttribute(config, "hiddenSSID", false);
	plus.android.getAttribute(config, "allowedAuthAlgorithms").set(WifiConfiguration.AuthAlgorithm.OPEN);
	plus.android.getAttribute(config, "allowedGroupCiphers").set(WifiConfiguration.GroupCipher.TKIP);
	plus.android.getAttribute(config, "allowedKeyManagement").set(WifiConfiguration.KeyMgmt.NONE);
	plus.android.getAttribute(config, "allowedPairwiseCiphers").set(WifiConfiguration.PairwiseCipher.TKIP);
	plus.android.getAttribute(config, "allowedGroupCiphers").set(WifiConfiguration.GroupCipher.CCMP);
	plus.android.getAttribute(config, "allowedPairwiseCiphers").set(WifiConfiguration.PairwiseCipher.CCMP);
	plus.android.setAttribute(config, "status", WifiConfiguration.Status.ENABLED);

	let tempConfig = isExsits(wifiManager, ssid);
	let netId = plus.android.getAttribute(tempConfig, "networkId");
	console.log(netId);
	if (tempConfig !== null) {
		console.log('wifi已存在');
		//wifiManager.removeNetwork(plus.android.getAttribute(tempConfig, "networkId"));
		plus.android.autoCollection(tempConfig);
	}
	else{
		netId = wifiManager.addNetwork(config)
	}

	return {
		config: config,
		netId: netId
	};
}

/**
 * 检测ssid是否已经在配置好的网络信息里面
 * @param {Object} wifiManager
 * @param {Object} ssid
 */
function isExsits(wifiManager, ssid) {
	let rawssid = `"${ssid}"`,
		list = wifiManager.getConfiguredNetworks(),
		size = list.size(),
		wifiConfiguration;
	for (let i = 0; i < size; i++) {
		let wifiConfiguration = list.get(i);
		if (plus.android.getAttribute(wifiConfiguration, "SSID") === rawssid) {
			plus.android.autoCollection(list);
			return wifiConfiguration;
		}
	}
	plus.android.autoCollection(list);
	return null;
}

/**
 * 通过网络id删除wifi
 * @param {Object} wifiManager
 * @param {Object} paramInt
 */
function removeWifi(wifiManager, paramInt) {
	wifiManager.disableNetwork(paramInt);
	wifiManager.disconnect();
	wifiManager.removeNetwork(paramInt);
	wifiManager.saveConfiguration();
}


// 获取当前连接ssid
function getConnectedSSID() {
	// 获取 WIFI 管理实例
	let wifiManager = getWifiManager();
	let ssid = wifiManager.getConnectionInfo().getSSID();
	plus.android.autoCollection(wifiManager);
	return ssid;
}

module.exports = {
	connectWifi: setWifi, //连接wifi
	getConnectedSSID: getConnectedSSID, //获取当前wifi ssid
	removeWifi(i) { // 通过网络id删除wifi
		let wifiManager = getWifiManager();
		removeWifi(wifiManager, i);
		plus.android.autoCollection(wifiManager);
	},
	removeWifiBySSID(ssid) { // 通过ssid删除wifi
		if (ssid == null || ssid == "" || ssid.length < 1) {
			return;
		}
		plus.android.importClass("android.net.wifi.WifiConfiguration");
		let wifiManager = getWifiManager();
		let tempConfig = isExsits(wifiManager, ssid);
		if (tempConfig != null) {
			removeWifi(wifiManager, plus.android.getAttribute(tempConfig, "networkId"));
		}
		plus.android.autoCollection(wifiManager);
	},
}
