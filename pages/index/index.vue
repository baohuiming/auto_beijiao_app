<template>
	<view class="content">
		<view class="text-area">
			<text class="title">{{title}}</text>
		</view>
		<input v-model="ssid" placeholder="SSID" />
		<input v-model="student_number" placeholder="学号" />
		<input v-model="password" placeholder="密码" password />
		<button @click="connect">连接</button>
		<checkbox-group @change="cb_change">
			<label>
				<checkbox value="autoConnect" :checked="autoConnect" />打开软件后自动连接
			</label>
		</checkbox-group>
		<div id="loading">
			<div class="spinner" v-show="loading">
				<div class="double-bounce1"></div>
				<div class="double-bounce2"></div>
			</div>
		</div>
		<view class="about">
			<text>
				版本：1.2.2<br>
				作者：鲍慧明<br>
			</text>
			<text class="link" @click="get_update">获取最新版</text>
		</view>
	</view>
</template>

<script>
	import {
		connectWifi,
		getConnectedSSID,
		removeWifi,
		removeWifiBySSID,
		disconnectWifi
	} from '../../js_sdk/cx-wifi/cx-wifi/cx-wifi.js'
	let timer, timer2;
	export default {
		data() {
			return {
				title: '连接北交校园网',
				ssid: 'local.wlan.bjtu',
				student_number: null,
				password: null,
				autoConnect: false,
				loading: false,
				accessibility: null,
			}
		},
		onLoad() {
			let self = this;
			self.student_number = uni.getStorageSync("student_number")
			self.password = uni.getStorageSync("password")
			self.autoConnect = uni.getStorageSync("autoConnect") || false
			self.ssid = uni.getStorageSync("ssid") || 'local.wlan.bjtu'
			if (self.student_number != null && self.password != null && self.autoConnect == true) {
				//console.log('自动连接');
				self.loading = true
				self.connect()
			}
		},
		onShow() {
			var args = plus.runtime.arguments;
			if (args) {
				// 处理args参数，如直达到某新页面等
				let self = this;
				args = JSON.parse(args);
				if (args.route == "networkStatusChange") {
					self.connect()
				}
			}
		},
		methods: {
			connectWifi() {
				let self = this;
				setTimeout(function() {
					self.loading = true
				}, 0)
				let nowSSID = getConnectedSSID()
				if ('\"' + self.ssid + '\"' != nowSSID) {
					//连接其他wifi时
					//断开其他wifi的连接
					let res;
					while (1) {
						res = disconnectWifi();
						if (res === true) {
							while (1) {
								res = connectWifi(self.ssid)
								if (res.status == true) {
									self.loading = false
									return true
								}
							}
							break
						}
					}
				} else {
					//已经连接wifi时
					self.loading = false
					return true
				}
			},
			connectWeb(callback) {
				let self = this;
				self.loading = true
				// 用户信息参数
				let users_params = {
					'DDDDD': self.student_number,
					'upass': self.password,
				}
				// 固定参数
				const fixed_params = {
					'0MKKey': '123456',
					'R1': '0',
					'R3': '0',
					'R6': '0',
					'para': '00',
					'v6ip': ''
				}
				// 时间参数
				let t = Date.now(); // 获取毫秒级时间戳
				let interval = 5000; // 页面加载完毕到点击确认按钮的时间间隔， 单位ms
				let time1_params = {
					'callback': 'dr' + (t + interval).toString()
				}
				let time2_params = {
					'_': t,
				} // 测试表明只有当callback位于参数第一个，用户名紧随其后，_位于末尾时请求才有效
				let params = Object.assign(time1_params, users_params, fixed_params, time2_params);

				const url = 'http://10.10.43.3/drcom/login'
				uni.request({
					url: url,
					timeout: 500,
					method: 'GET',
					data: params,
					success: res => {
						if (res.data.indexOf('\"result\":1') != -1) {
							uni.showToast({
								icon: "none",
								title: "连接成功"
							})
							self.loading = false
							if (typeof callback == 'function') {
								callback({
									status: 'success',
									code: 1
								})
							}
						} else if (res.data.indexOf('error') != -1) {
							uni.showToast({
								icon: "none",
								title: "请求过于频繁"
							})
							if (typeof callback == 'function') {
								callback({
									status: 'fail',
									code: 2
								})
							}
						} else {
							uni.showToast({
								icon: "none",
								title: "账户不可用"
							})
							if (typeof callback == 'function') {
								callback({
									status: 'fail',
									code: 3
								})
							}
						}
					},
					fail: res => {
						uni.showToast({
							icon: "none",
							title: "连接失败，请在“登录到WLAN网络”界面选择“保持连接”"
						})
						if (typeof callback == 'function') {
							callback({
								status: 'fail',
								code: 0
							})
						}
					},
					complete: () => {
						self.saveStorage()
					}
				});
			},
			saveStorage() {
				let self = this;
				uni.setStorage({
					key: "student_number",
					data: self.student_number
				})
				uni.setStorage({
					key: "password",
					data: self.password
				})
				uni.setStorage({
					key: "ssid",
					data: self.ssid
				})
			},
			connect() {
				let self = this;
				clearTimeout(timer);
				if (self.accessibility == null) {
					self.accessibility = self.isAccessibilityServiceOn();
				}
				self.connectWifi()
				self.connectWeb(function(res) {
					if (res.status == 'fail') {
						switch (res.code) {
							case 0:
								if (self.accessibility == true) {
									self.go_to_page('wifi')
								}
								uni.onNetworkStatusChange(function(res) {
									if (res.networkType == "wifi") {
										//网络状态更改为wifi
										plus.runtime.launchApplication({
											pname: "com.baohuiming.autowifi",
											extra: {
												url: "baohuiming://com.baohuiming.autowifi", //B款app配置的schemes+云打包的包名
												route: "networkStatusChange"
											},
										}, function(res) {
											console.log(res);
										});
										uni.offNetworkStatusChange(function() {})
									}
								})

								//return self.connect()
								break;
							case 3:
								clearTimeout(timer2);
								timer = setTimeout(function() {
									return self.connect()
								}, 1000)
								break;
							default:
								clearTimeout(timer2);
								timer = setTimeout(function() {
									return self.connect()
								}, 3000)
								break;
						}
					} else if (res.status == 'success') {
						clearTimeout(timer2);
						clearTimeout(timer);
						plus.runtime.quit()
					}
				})
			},
			cb_change(e) {
				let self = this;
				self.autoConnect = (e.detail.value[0] == 'autoConnect');
				uni.setStorage({
					key: "autoConnect",
					data: self.autoConnect
				})
			},
			get_update() {
				plus.runtime.openURL('https://baohuiming.xyz/articles/auto-wifi')
			},
			go_to_page(page) {
				//获取宿主上下文
				var main = plus.android.runtimeMainActivity();
				if (page == 'wifi') {
					//获取Android的Intent对象
					var Intent = plus.android.importClass("android.content.Intent");
					//创建 intent
					var intent = new Intent();
					intent.setClassName("com.android.settings", "com.android.settings.Settings$WifiSettingsActivity");
					//开启新的任务栈 （跨进程）
					//intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
					//开启新的界面
					main.startActivity(intent);
				}
			},
			isAccessibilityServiceOn() {
				// 判断辅助功能是否开启，需要在程序初始化结束后调用
				let serviceName = "com.baohuiming.skipsamsungportal";
				var MainActivity = plus.android.runtimeMainActivity();
				var Context = plus.android.importClass('android.content.Context');
				plus.android.importClass('java.util.ArrayList');
				plus.android.importClass('android.content.pm.ResolveInfo');
				let AccessibilityEvent = plus.android.importClass('android.view.accessibility.AccessibilityEvent');
				let am = MainActivity.getSystemService(Context.ACCESSIBILITY_SERVICE);
				//let slist = plus.android.invoke(am, "getInstalledAccessibilityServiceList");
				let slist = plus.android.invoke(am, "getEnabledAccessibilityServiceList", AccessibilityEvent.TYPES_ALL_MASK);
				if (slist != null) {
					let len = plus.android.invoke(slist, "size");
					for (let i = 0; i < len; i++) {
						let serviceInfo = plus.android.invoke(slist, "get", i);
						let resolveInfo = plus.android.invoke(serviceInfo, "getResolveInfo");
						let resolveInfoStr = plus.android.invoke(resolveInfo, 'toString');
						console.log(resolveInfoStr);
						if (resolveInfoStr.indexOf(serviceName) != -1) {
							// 辅助功能已开启
							return true
						}
					}
				}
				return false
			}
		}
	}
</script>

<style lang="scss">
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.logo {
		height: 200rpx;
		width: 200rpx;
		margin-top: 200rpx;
		margin-left: auto;
		margin-right: auto;
		margin-bottom: 50rpx;
	}

	.text-area {
		display: flex;
		justify-content: center;
	}

	.title {
		font-size: 48rpx;
		font-family: Arial, Helvetica, sans-serif;
		font-weight: 600;
		color: #333333;
		line-height: 80px;
		margin-top: 80px;
	}

	input {
		margin: 2px;
		padding: 10px 12px;
		background-color: #F8F8F8;
	}

	button {
		width: 180px;
		background-color: #0059b9;
		color: #fff;
		margin: 5px;
	}

	button::after {
		border: none;
	}

	.about {
		margin: 25px;
		text-align: center;

		text {
			line-height: 25px;
		}

		.link {
			color: #55aaff;
			text-decoration: underline;
			margin-top: 3px;
		}
	}

	#loading {

		width: 60px;
		height: 60px;

		position: relative;
		margin: 20px auto;


		.double-bounce1,
		.double-bounce2 {
			width: 100%;
			height: 100%;
			border-radius: 50%;
			background-color: #0055ff;
			opacity: 0.6;
			position: absolute;
			top: 0;
			left: 0;

			-webkit-animation: bounce 2.0s infinite ease-in-out;
			animation: bounce 2.0s infinite ease-in-out;
		}

		.double-bounce2 {
			-webkit-animation-delay: -1.0s;
			animation-delay: -1.0s;
		}

		@-webkit-keyframes bounce {

			0%,
			100% {
				-webkit-transform: scale(0.0)
			}

			50% {
				-webkit-transform: scale(1.0)
			}
		}

		@keyframes bounce {

			0%,
			100% {
				transform: scale(0.0);
				-webkit-transform: scale(0.0);
			}

			50% {
				transform: scale(1.0);
				-webkit-transform: scale(1.0);
			}
		}
	}
</style>
