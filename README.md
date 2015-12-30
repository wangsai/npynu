# npynu
Node SDK for  UPYUN

UPYUN API 参考：http://docs.upyun.com/api/

> 本 SDK 是在 https://github.com/upyun/node-upyun.git 基础上修改而来。由于 node-upyun 对某些 API 的实现已经
> 很久没有更新了，与 官方的 API 描述不一致，因此简单修改一下先凑合用。


## 安装
```sh
$ npm install npynu --save
```

## 引入并初始化
```js
var UPYUN = require('npynu');
var upyun = UPYUN(options);
```

__参数__

* `bucket`: 你要使用的 upyun 空间名字。（必须）
* `operator`: 拥有 `bucket` 授权的操作员。（必须）
* `password`: 拥有 `bucket` 授权的操作员的密码。（必须）
* `endpoint` API 接入点，可以刷是如下值:
  * `ctcc` 或 `v1`: 中国电信
  * `cucc` 或 `v2`: 中国联通
  * `cmcc` 或 `v3` 中国移动
  * `v0` 或 任何其他的值: 将使用 `v0.api.upyun.com` （自动选择合适的线路）


## 关于错误捕获

node-upyun 的错误捕获方式很怪异，是在发生错误后通过正常结果反映 api 调用的结果状态，导致
每次处理错误都会很麻烦。

npynu 直接通过 err 抛出错误，并且携带错误说明。例如：

```
Error: {"msg":"bucket not exist","code":40100012,"id":"0f12e8fe6b1f213967018fd3e3cf6419"}
```

## api 调用结果

对于 api 正常执行返回的结果和 node-upyun 是一致的，都是返回一个对象，例如：

```js
{
    statusCode: 200,    // HTTP 状态码
    headers: {
        server: 'nginx/1.1.19',
        date: 'Wed, 13 Aug 2014 02:15:27 GMT',
        'content-type': 'application/json',
        'content-length': '24',
        connection: 'close'
    },                  // API 响应头部
    data: ''// 响应主体。注意：这里返回的是 upyun 返回的原始数据
}
```

`data` 字段返回的是 upyun 返回的原始数据，目前只有 `listDir` 、`getUsage` 、 `downloadFile`会通过 `data` 变量返回内容，
需要调用者自己处理。


## API

* [`getUsage`](#getUsage)
* [`listDir`](#listDir)
* [`createDir`](#createDir)
* [`removeDir`](#removeDir)
* [`uploadFile`](#uploadFile)
* [`existsFile`](#browseFile)
* [`downloadFile`](#downloadFile)
* [`removeFile`](#removeFile)

<a name="getUsage"><a/>
### getUsage(callback)
获取空间使用状况.(单位:`Byte`)

__响应__

```js
 {
     statusCode: 200,
     headers: { ... },
     data: '1234567890'
 }
```

---------------------------------------

<a name="listDir"><a/>
### listDir(remotePath, [order], callback)
遍历指定目录（只遍历当前层级目录，不循环遍历）。响应结果为 upyun 返回的原始数据，详见： http://docs.upyun.com/api/rest_api/#_13

__参数__
* `remotePath` 欲遍历的目录
* `order` 以 `last_modified` 的值正序或者倒序排列 `asc`(正序) 或 `desc`(倒序).(Default: `desc`)

__响应__

```js
{
    statusCode: 200,
    headers: {...
    },
    data: 'test\tF\t0\t1451465540\npackages.json\tN\t441\t1451465246\np\tF\t0\t1437107983\nfiles\tF\t0\t1436286519' }
}
```

**如果文件列表信息过大，由调用者酌情处理更合适**

---------------------------------------

<a name="createDir"><a/>
### createDir(remotePath, callback)
创建文件夹。不抛出错误即为正常返回。

__参数__
* `remotePath` 欲创建的目录路径


__响应__

```js
{
    statusCode: 200,
    headers: {...
    },
    data: '' }
}

---------------------------------------

<a name="removeDir"><a/>
### removeDir(remotePath, callback)
删除文件夹。**注意：upyun 限定只能删除空目录，对于巨量数据来说删除一个目录设计到递归删除所有目录下的文件，很不方便。**

* `remotePath` 欲移除的目录路径

同上

---------------------------------------

<a name="uploadFile"><a/>
### uploadFile(remotePath, localFile, [opts], callback)
上传文件

__参数__
* `remotePath` 文件存放路径
* `localFile` 欲上传的文件，可以是文件的本地路径或者文件本身的内容
* `opts` 其他请求头部参数（以 JS 对象格式传入，常用于图片处理等需求）. 更多请参考 [官方 API 文档](http://docs.upyun.com/api/rest_api/#_4)
    * `type` 指定文件的 `Content-Type`
    * `checksum` 为 `null` 时 SDK 会计算文件的 md5 值并将其传于 API 校验，此外，你也可以直接指定一个 md5 值字符串
    * `secret` 见文档


__响应__

```js
{
    statusCode: 200,
    headers: {...
    },
    data: ''
}
```

---------------------------------------

<a name="browseFile"><a/>
### browseFile(remotePath, callback)
`HEAD` 获取文件详情

__参数__
* `remotePath` 文件在 upyun 空间的路径

__响应__

```js
{
    statusCode: 200,
    headers: {...
    },
    fileType: 'file', //文件夹为 `folder`
    fileSize: '2345', //文件大小
    fileCreateDate: '2424524'  //文件创建时间
    data: '' }
}

---------------------------------------

<a name="downloadFile"><a/>
### downloadFile(remotePath, [localPath], callback)
下载文件

__参数__
* `remotePath` 文件在 upyun 空间的路径
* `localPath` 文件在本地存放路径， 如果省略 `localPath` 参数，文件的内容将会直接在响应的主体中返回


---------------------------------------

<a name="removeFile"><a/>
### removeFile(remotePath, callback)
删除文件

__参数__
* `remotePath` 文件在 upyun 空间的路径