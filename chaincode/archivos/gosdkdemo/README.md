# gosdkdemo 使用说明

------

使用 fabric-sdk-go 进行链代码的query和invoke

> * fabric服务
> * fabric v1.1 v1.4 v2.2
> * fabrci-go-sdk v1.0.0
> * go >=1.12，<1.16
> * 配置文件和证书

## 1、目录说明
	fabric-go-demo
        --src/main.go  sdk使用参考示例
        --src/fabric-sdk-go  fabric-sdk-go 源码

## 2、配置文件说明

重点关注organizations的配置项 cryptoPath 
client 使用的cryptoPath 的msp,tls证书与fabric交互。

## 3、Main文件说明

重点关注 main 方法的初始化，示例使用的链代码为“应用案例”中，“GO示例Demo-GO SDK Demo”提供的 go_chaincodedemo.zip
```
func main(){
	// load config file to config
	loadConfig()
	// initialize sdk
	initializeSdk()
	// insert data <testuser,100>
	insert("insert",[][]byte{
		[]byte("testuser"),
		[]byte("100"),
	})
	// query data, key="testuser"
	query("query",
		[][]byte{
		[]byte("testuser"),
	})

}
```

## 4、MSP和TLS私钥通过内存传入说明
> * 配置文件指定路径下MSP私钥通过函数GetPrivateKeyBytes传入组织Id读取。
> * 配置文件指定路径下MSP证书通过函数GetSigncertsBytes传入组织Id读取。
> * 读取到的MSP私钥如果是加密的，经过解密后调用SetPrivateKey重新赋值给全局变量privateKey，获取FabricUser时若UserIdentityWithOrgAndName方法的privateKey变量不为空（或同时cert变量不为空），则根据传入的privateKey变量（和cert变量）创建FabricUser，否则默认从配置文件指定的MSP私钥和证书文件读取MSP私钥和证书；privateKey变量可以通过函数ClearPrivateKey重置。
> * 配置文件指定路径下TLS私钥通过函数GetTlsCryptoKey传入组织Id读取。
> * 读取到的TLS私钥如果是加密的，经过解密后调用SetClientTlsKey将解密后的TLSKey传入Fabric-SDK，实现通过内存传入TLSKey；传入Fabric-SDK的TLSKey可以通过函数ClearClientTlsKey重置。