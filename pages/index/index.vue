<template>
	<view class="content">
		<view class="title">{{title}}</view>
		<view class="connect">
			<view class="connect-item">
				<text class="icon">&#xe657;</text>
				<input v-model="ssid" placeholder="SSID" placeholder-class="placeholder-class" />
			</view>
			<view class="connect-item">
				<text class="icon">&#xe613;</text>
				<input v-model="student_number" placeholder="学号" placeholder-class="placeholder-class" />
			</view>
			<view class="connect-item">
				<text class="icon">&#xe616;</text>
				<input v-model="password" placeholder="密码" password placeholder-class="placeholder-class" />
			</view>
			<button @click="connect" v-show="!loading">连接</button>
			<div id="loading" v-show="loading">
				<div class="spinner">
					<div class="double-bounce1"></div>
					<div class="double-bounce2"></div>
				</div>
			</div>
		</view>
		<view class="config">
			<uni-list class="list">
				<uni-list-item title="自动连接" note="打开软件后自动连接" showSwitch="true" @switchChange="switch_auto_connect" :switchChecked="autoConnect"></uni-list-item>
				<uni-list-item title="插件" note="用以跳过WiFi认证,仅支持三星手机" :rightText="accessibility.install?accessibility.on?'已启用':'未启用':'去安装'" :rightTextStyle='accessibility.on?"color: green;":"color: red;"' link :clickable="true" @click="switch_accessibility"></uni-list-item>
				<uni-list-item title="版本" :rightText="version" link :clickable="true" @click="get_update"></uni-list-item>
				<uni-list-item title="作者" rightText="鲍慧明" link :clickable="true" @click="get_author_homepage"></uni-list-item>
			</uni-list>
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
	let timer;
	export default {
		data() {
			return {
				title: '直连北交校园网',
				ssid: 'local.wlan.bjtu',
				student_number: null,
				password: null,
				autoConnect: false,
				loading: false,
				accessibility: {
					install: null,
					on: null
				},
				version: "1.3.0"
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
			let self = this;
			var args = plus.runtime.arguments;
			if (args) {
				// 处理args参数，如直达到某新页面等
				let self = this;
				args = JSON.parse(args);
				if (args.route == "networkStatusChange") {
					self.connect()
				}
			}
			self.accessibility = self.check_accessibility_service();
		},
		methods: {
			connectWifi() {
				let self = this;
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
				let interval = 5000; // 页面加载完毕到点击确认按钮的时间间隔，单位ms
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
				self.loading = true
				clearTimeout(timer);
				self.connectWifi()
				self.connectWeb(function(res) {
					if (res.status == 'fail') {
						switch (res.code) {
							case 0:
								if (self.accessibility.on == true) {
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
								timer = setTimeout(function() {
									return self.connect()
								}, 1000)
								break;
							default:
								timer = setTimeout(function() {
									return self.connect()
								}, 3000)
								break;
						}
					} else if (res.status == 'success') {
						clearTimeout(timer);
						plus.runtime.quit()
					}
				})
			},
			switch_auto_connect(e) {
				let self = this;
				self.autoConnect = e.value;
				uni.setStorage({
					key: "autoConnect",
					data: self.autoConnect
				})
			},
			get_update() {
				plus.runtime.openURL('https://baohuiming.xyz/articles/auto-wifi')
			},
			get_author_homepage() {
				plus.runtime.openURL('https://github.com/bjtu-bhm')
			},
			go_to_page(page) {
				//获取宿主上下文
				var main = plus.android.runtimeMainActivity();
				var Intent = plus.android.importClass("android.content.Intent");
				var intent = new Intent();
				if (page == 'wifi') {
					intent.setClassName("com.android.settings", "com.android.settings.Settings$WifiSettingsActivity");

				} else if (page == 'accessibility') {
					intent.setClassName("com.android.settings", "com.android.settings.Settings$AccessibilityInstalledServiceActivity")
				} else {
					return
				}
				//开启新的任务栈 （跨进程）
				//intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
				main.startActivity(intent);
			},
			check_accessibility_service() {
				// 判断辅助功能是否开启，需要在程序初始化结束后调用
				let serviceName = "com.baohuiming.skipsamsungportal";
				var MainActivity = plus.android.runtimeMainActivity();
				var Context = plus.android.importClass('android.content.Context');
				plus.android.importClass('java.util.ArrayList');
				plus.android.importClass('android.content.pm.ResolveInfo');
				let AccessibilityEvent = plus.android.importClass('android.view.accessibility.AccessibilityEvent');
				let am = MainActivity.getSystemService(Context.ACCESSIBILITY_SERVICE);
				let ilist = plus.android.invoke(am, "getInstalledAccessibilityServiceList");
				let elist = plus.android.invoke(am, "getEnabledAccessibilityServiceList", AccessibilityEvent.TYPES_ALL_MASK);

				function check(list) {
					if (list != null) {
						let len = plus.android.invoke(list, "size");
						for (let i = 0; i < len; i++) {
							let serviceInfo = plus.android.invoke(list, "get", i);
							let resolveInfo = plus.android.invoke(serviceInfo, "getResolveInfo");
							let resolveInfoStr = plus.android.invoke(resolveInfo, 'toString');
							//console.log(resolveInfoStr);
							if (resolveInfoStr.indexOf(serviceName) != -1) {
								// 辅助功能已开启或已安装
								return true
							}
						}
					}
					return false
				}

				return {
					install: check(ilist),
					on: check(elist)
				}

			},
			switch_accessibility() {
				let self = this;
				if (self.accessibility.install != true) {
					// 去安装插件
					self.get_update()
				} else {
					// 已经安装插件
					self.go_to_page('accessibility')
				}
			}
		}
	}
</script>

<style lang="scss">
	$bg-color: #4287e8;

	@font-face {
		font-family: 'iconfont';
		src: url('~@/static/iconfont.ttf');
	}

	page {
		background-color: #f8f8f8;
	}

	.title {
		background-color: $bg-color;
		color: white;
		font-size: 60rpx;
		font-family: Arial, Helvetica, sans-serif;
		padding: 12px 0 0 18px;
	}

	.connect {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background-color: $bg-color;
		padding-top: 20px;
		.connect-item{
			display: flex;
			line-height: 48px;
		}
		padding-bottom: 15px;
	}

	.text-area {
		display: flex;
		justify-content: center;
	}

	input {
		margin: 3px 0;
		padding: 10px 12px;
		background-color: lighten($color: $bg-color, $amount: 15);
		border-radius: 0 6px 6px 0;
		color: white;
		width: 500rpx;
		height: 28px;
	}
	
	.icon {
		font-family: 'iconfont';
		font-size: 24px;
		color: #f5f5f5;
		margin: 3px 0;
		background-color: lighten($color: $bg-color, $amount: 15);
		height: 48px;
		line-height: 48px;
		border-radius: 6px 0 0 6px;
		padding-left: 12px;
	}

	.placeholder-class {
		color: #e3e3e3;
	}

	button {
		width: 140px;
		background-color: #82bfff;
		color: #fff;
		margin: 5px;
		border-radius: 90px;
		font-size: 16px;
		height: 40px;
		line-height: 40px;
		font-family: Arial, Helvetica, sans-serif;
		letter-spacing: 2px;
		font-weight: bolder;
		margin: 25px auto;
	}

	button::after {
		border: none;
	}

	#loading {

		width: 60px;
		height: 60px;

		position: relative;
		margin: 15px auto;


		.double-bounce1,
		.double-bounce2 {
			width: 100%;
			height: 100%;
			border-radius: 50%;
			background-color: #82bfff;
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

	.list {
		width: 100%;
	}
</style>
