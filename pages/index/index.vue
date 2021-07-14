<template>
	<view class="content">
		<view class="text-area">
			<text class="title">{{title}}</text>
		</view>
		<input :value="ssid" />
		<button @click="connect">连接</button>
	</view>
</template>

<script>
	import {
		connectWifi,
		getConnectedSSID,
		removeWifi,
		removeWifiBySSID
	} from '../../js_sdk/cx-wifi/cx-wifi/cx-wifi.js'
	export default {
		data() {
			return {
				title: '自动连接北交校园网',
				ssid: 'web.wlan.bjtu'
			}
		},
		onLoad() {
			let self = this;
		},
		methods: {
			connect() {
				let self = this;
				let res = connectWifi(self.ssid)
				console.log(res);
			}
		}
	}
</script>

<style>
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
		font-size: 36rpx;
		color: #8f8f94;
	}
</style>
