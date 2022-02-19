---
title: HTML5的图片上传、预览与压缩功能的实现
date: 2018-01-14 00:17:09
tags: ["HTML5", "图片上传"]
category: frontend
---

近日，在某个项目上线了一个功能需求，在移动设备（H5 端）实现图片上传预览并压缩，尤其是在当前各种移动设备盛行的年代，各大手机厂商为了推广手机可谓是下足了功夫，各种吹捧自己的手机多少多少万的相机，那么随之而来的，便是随手一拍，一张照片的大小轻轻松松上兆，于是乎，图片在上传到服务器之前压缩便成了必不可少的一步。

第一次接到这个需求的时候，当然第一反应从内心来讲是拒绝的，毕竟 H5 的环境与原生开发的环境还是不同的，调用原生的能力相对较弱，H5 想要调用原生能力还是需要浏览器的支持，即使某些个浏览器支持，也不能保证所有的浏览器都支持，这注定是一个麻烦的需求。

但是，既然需求来了，那么兵来将挡，水来土掩，那就折腾折腾吧。

<!-- more -->

## 实现思路

在一番查阅资料与不断的实践摸索之后，确定了实现思路，如下：

1、放置一个 type 为 file 的 input 调起手机相册和相机；
2、通过 createObjectURL 或者 FileReader 读取 input 上传的文件，存入一个数组；
3、预览图片可以直接通过 img 标签加载上一步读取的结果；
4、遍历第二步存入的数组，构造多个 image 对象，同时创建多个 canvas，将图片写入到 canvas；
5、点击某个预览图上的删除按钮，删除对应的第二步数组中的图片，并重复第四步重新生成，并绑定相关事件，如删除事件；
6、点击提交通过 canvas 的 toBlob 或 toDataURL 将图片导出相关格式，目前这个导出的是 blob 格式（也就是二进制格式），追加到另一个数组；
7、点击提交按钮，通过 FormData 构造一个对象，并将上一步的 blob 数组 append 进去；

## 具体实现

### 放置 input

如果 UI 类似于如下的模样，直接将 input 的透明度设置为 0，在上面叠加一个层就可以了。
![jsBridge](../media/2018/1/addIcon.png)

### 读取文件并存入数组

支持 URL，便通过 URL.createObjectURL 读取，不支持则通过 FileReader 进行读取；
最终将读取到的图片存储到 Upload 实例的 imgList 数组中。

```
/**
 *	上传图片
 */
Upload.prototype.upload = function(t, e) {
	var files = e.target.files;
	if(window.URL) {
		for(var i = 0, len = files.length; i < len; i++) {
			console.log(t.imgList);
			t.imgList.push(window.URL.createObjectURL(files[i]));
		}
		//如果获取到的长传图片数组为空，停止执行
		if(t.imgList <= 0) {
			alert("未获取到上传的图片,请重新上传！");
		} else {
			t.createIMG();
		}
	} else if(window.FileReader) {
		//opera不支持createObjectURL/revokeObjectURL方法。用FileReader对象来处理
		for(var i = 0, len = files.length; i < len; i++) {
			var reader = new FileReader();
			reader.readAsDataURL(files[i]);
			reader.onload = function(e) {
				t.imgList.push(this.result);
				//如果获取到的长传图片数组为空，停止执行
				if(t.imgList <= 0) {
					alert("未获取到上传的图片,请重新上传！");
				} else {
					t.createIMG();
				}
			}
		}
	}
}
```

### 生成预览图

遍历实例上的 imgList 数组，生成预览图片和最终导出用到的 canvas，目前，这里每张上传的图片用了两个 canvas：
一个 canvas 用来显示预览图，这个 canvas 相对较小；
另一个 canvas 用来导出二进制的图片，相对较大，隐藏在第一个 canvas 的后边；

注：创建完预览图之后需要重新绑定下事件

```
/**
 *	根据上传图片生成预览图
 */
Upload.prototype.createIMG = function() {
	$(this.conf.wrap).empty();
	// console.log(this.imgList);
	var self = this;
	for(var i = 0, len = this.imgList.length; i < len; i++) {
		(function(m) {
			var imgItemWrap = self.createCanvas(self.imgList[m]);
			$(self.conf.wrap).append(imgItemWrap);
		})(i)
	}

	//绑定删除图片
	this.rmIMG();
}
```

写入图片到 canvas:

```
/**
 * 转换图片到canvas
 */
Upload.prototype.createCanvas = function(uri) {
	var
		canvas = document.createElement('canvas'),
		bigImgCanvas = document.createElement('canvas'),
		imgItemWrap = document.createElement('div'),
		removeDiv = document.createElement('div'),
		imgItem = new Image(),
		context = canvas.getContext('2d'),
		bigContext = bigImgCanvas.getContext('2d');

	canvas.width = 80;
	canvas.height = 80;
	canvas.className = 'uploadImg';
	bigImgCanvas.className = 'outputImg';
	imgItemWrap.className = 'uploadItem';
	removeDiv.className = 'removeWrap';
	removeDiv.innerHTML = 'X';

	bigImgCanvas.style.display = "none";
	//计算该图片的缩放比例

	imgItem.onload = function() {
		//每张图片需要保存的canvas
		bigImgCanvas.width = imgItem.naturalWidth;
		bigImgCanvas.height = imgItem.naturalHeight;
		var dpr = 80 / imgItem.naturalWidth;
		//		console.log(dpr);
		console.log(imgItem.width);
		context.drawImage(imgItem, 0, 0, 80, imgItem.naturalHeight * dpr);
		bigContext.drawImage(imgItem, 0, 0, imgItem.naturalWidth, imgItem.naturalHeight);
	};

	imgItem.src = uri;
	$(imgItemWrap).append(canvas);
	$(imgItemWrap).append(bigImgCanvas);
	$(imgItemWrap).append(removeDiv);
	return imgItemWrap;

}
```

至此，图片上传加预览的工作已经完成了，在每张预览图的后面都有一个隐藏的 Canvas，用于导出大图，因为预览图的 canvas 直接导出来的图片会很模糊，所以，不得已需要重新用一个大的 canvas 来导出图片。

## 导出图片

上面，已经把需要用于导出的 canvas 绘制到了页面上，遍历所有的隐藏的 canvas，通过 canvas 的 toDataURL 或 toBlob，将 canvas 导出即可。

toDataURL 接收两个参数，第一个参数为导出类型，默认值为：image/png，第二个参数为导出质量，取值为 0~1。
toBlob 接收三个参数，第一个参数为回调函数，因为导出二进制 blob 文件为异步操作，所以需要在第回调函数内获取导出的二进制文件流。第二个参数和第三个参数对应上面 toDataURL 的两个参数。

```
/**
 *	压缩图片
 *
 **/
Upload.prototype.post = function() {
	if($('.outputImg').length <= 0) return;
	this.blobData = [];
	var self = this;
	for(var i = 0; i < $('.outputImg').length; i++) {
		(function(m) {
			var compressedImageBlob = self.dataURL2Blob($('.outputImg')[m].toDataURL("image/jpeg",0.1));
			self.blobData.push(compressedImageBlob);
			console.log(compressedImageBlob) // 压缩图像文件的大小
			console.log(URL.createObjectURL(compressedImageBlob));	//图片
			console.log(self) // 源文件的大小
		})(i)
	}
}
```

将 dataURL 转换成二进制 blob 对象：

```
Upload.prototype.newBlob = function(data, datatype) {
	var out
	try {
		out = new Blob([data], {
			type: datatype
		})
	} catch(e) {
		window.BlobBuilder = window.BlobBuilder ||
			window.WebKitBlobBuilder ||
			window.MozBlobBuilder ||
			window.MSBlobBuilder

		if(e.name == 'TypeError' && window.BlobBuilder) {
			var bb = new BlobBuilder()
			bb.append(data)
			out = bb.getBlob(datatype)
		} else if(e.name == 'InvalidStateError') {
			out = new Blob([data], {
				type: datatype
			})
		} else {
			throw new Error('Your browser does not support Blob & BlobBuilder!')
		}
	}
	return out
}

// data URIs to Blob
Upload.prototype.dataURL2Blob = function(dataURI) {
//	console.log(dataURI)
	var byteStr
	var intArray
	var ab
	var i
	var mimetype
	var parts

	parts = dataURI.split(',')
	parts[1] = parts[1].replace(/\s/g, '')

	if(~parts[0].indexOf('base64')) {
		byteStr = atob(parts[1])
	} else {
		byteStr = decodeURIComponent(parts[1])
	}

	ab = new ArrayBuffer(byteStr.length)
	intArray = new Uint8Array(ab)

	for(i = 0; i < byteStr.length; i++) {
		intArray[i] = byteStr.charCodeAt(i)
	}

	mimetype = parts[0].split(':')[1].split(';')[0]

	return new this.newBlob(ab, mimetype)
}
```

### 提交 blob 给服务器

通过 formData 构造一个实例，将上面的图片 append 进去。

```
/**
 *	提交图片到接口
 **/
Upload.prototype.xhr = function() {
	if(this.blobData.length <= 0) return;
	var fd = new FormData();
	fd.append('imgList', this.blobData);
	console.log(this.blobData);
	$.ajax({
		"url": "http://192.168.1.111:8090/upload",
		method: "post",
		contentType: false,
		processData: false,
		data: fd,
		success: function(result) {
			console.log(result);
		},
		error(xhr, status, error) {
			console.log(error);
		}
	})
}
```

## 待优化

至此，整个功能便实现了，还有几个待优化的点，因为上线时间的关系没有做处理：

- 导出二进制文件的 canvas 没有必要每个图片生成多个，可以减少开销，只放一个，通过遍历存放图片的数组，每次生成完一个可以再写入下一个。
- 目前所有的图片都转换成了 jpg 的格式，可以在第一次拿到上传的图片的时候，将图片的类型存起来，在从 canvas 导出的时候按照原格式导出。
- 同上，还有图片的名称。
- 因为找不到一个 api 专门用来控制转换成图片的大小界定值，只能通过图片质量的设置来控制图片的大小，但是可以获取到二进制的大小，所以，如果服务器有大小限制，比如说 200K，或许可以递归去再次写入压缩后超出 200K 的图片，再次导出，直到图片到达 200k 以内。

（完）
