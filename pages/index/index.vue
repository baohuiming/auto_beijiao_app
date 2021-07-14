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
				<checkbox value="autoConnect" :checked="autoConnect" />自动连接
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
				版本：1.0<br>
				作者：鲍慧明
			</text>
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
	export default {
		data() {
			return {
				title: '连接北交校园网',
				ssid: 'local.wlan.bjtu',
				student_number: null,
				password: null,
				autoConnect: true,
				loading: false
			}
		},
		onLoad() {
			let self = this;
			self.student_number = uni.getStorageSync("student_number")
			self.password = uni.getStorageSync("password")
			self.autoConnect = uni.getStorageSync("autoConnect")
			self.ssid = uni.getStorageSync("ssid")
			if (self.student_number != null && self.password != null && self.autoConnect == true) {
				console.log('自动连接');
				self.connect()
			}
		},
		methods: {
			connectWifi(callback) {
				let self = this;
				let nowSSID = getConnectedSSID()
				if ('\"' + self.ssid + '\"' != nowSSID) {
					if (disconnectWifi() === true) {
						let res = connectWifi(self.ssid);
						if (res.status == true) {
							callback()
							clearInterval(t)
						}
						let t = setInterval(function() {
							let res = connectWifi(self.ssid);
							if (res.status == true) {
								callback()
								clearInterval(t)
							}
						}, 3000)
					}
				} else {
					callback()
				}

			},
			connectWeb() {
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
					timeout: 3000,
					method: 'GET',
					data: params,
					success: res => {
						console.log(res);
						if (res.data.indexOf('\"result\":1') != -1) {
							uni.showToast({
								icon: "none",
								title: "连接成功"
							})
							self.loading = false
							plus.runtime.quit()
						} else if (res.data.indexOf('error') != -1) {
							uni.showToast({
								icon: "none",
								title: "账户暂不可用"
							})
							setTimeout(function() {
								self.connect()
							}, 3000)
						} else {
							uni.showToast({
								icon: "none",
								title: "连接失败"
							})
							setTimeout(function() {
								self.connect()
							}, 3000)
						}

					},
					fail: res => {
						uni.showToast({
							icon: "none",
							title: "连接失败"
						})
						setTimeout(function() {
							self.connect()
						}, 500)
					},
					complete: () => {
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
						uni.setStorage({
							key: "autoConnect",
							data: self.autoConnect
						})
					}
				});
			},
			connect() {
				let self = this;
				self.connectWifi(self.connectWeb)
			},
			cb_change(e) {
				let self = this;
				self.autoConnect = (e.detail.value[0] == 'autoConnect');
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
	}

	#loading {
		.spinner {
			width: 60px;
			height: 60px;

			position: relative;
			margin: 10px auto;
		}

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
