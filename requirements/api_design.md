# 登录与注册模块接口设计文档

根据 `login_register_requirement.md` 需求文档，设计以下 RESTful API 接口。

## 1. 认证模块 (Authentication)

### 1.1 发送短信验证码
*   **接口地址:** `POST /api/v1/auth/sms/send`
*   **描述:** 向指定手机号发送6位数字验证码。用于登录和注册流程。
*   **请求体 (Request Body):**
    ```json
    {
      "phoneNumber": "string", // 必填，手机号，例如 "13800138000"
      "type": "string"         // 必填，业务类型: "login" 或 "register"
    }
    ```
*   **响应 (Response):**
    *   **200 OK:**
        ```json
        {
          "success": true,
          "message": "验证码已发送",
          "expiresIn": 60 // 建议前端倒计时秒数
        }
        ```
    *   **400 Bad Request:**
        ```json
        {
          "success": false,
          "message": "手机号格式不正确"
        }
        ```
    *   **429 Too Many Requests:**
        ```json
        {
          "success": false,
          "message": "请求过于频繁，请稍后再试"
        }
        ```

### 1.2 账号密码登录
*   **接口地址:** `POST /api/v1/auth/login/password`
*   **描述:** 用户使用账号（手机号/邮箱/用户名）和密码登录。
*   **请求体 (Request Body):**
    ```json
    {
      "account": "string",  // 必填，账号
      "password": "string", // 必填，密码
      "agreeTerms": "boolean" // 必填，是否同意协议
    }
    ```
*   **响应 (Response):**
    *   **200 OK:**
        ```json
        {
          "success": true,
          "token": "eyJhbG...", // JWT Token
          "user": {
            "id": "u123456",
            "nickname": "携程用户",
            "avatar": "https://example.com/avatar.jpg"
          }
        }
        ```
    *   **400 Bad Request:** (如未同意协议)
        ```json
        {
          "success": false,
          "message": "请阅读并同意服务协议"
        }
        ```
    *   **401 Unauthorized:**
        ```json
        {
          "success": false,
          "message": "用户名或密码不正确"
        }
        ```

### 1.3 手机验证码登录
*   **接口地址:** `POST /api/v1/auth/login/sms`
*   **描述:** 用户使用手机号和短信验证码登录。
*   **请求体 (Request Body):**
    ```json
    {
      "phoneNumber": "string", // 必填
      "code": "string",        // 必填，6位验证码
      "agreeTerms": "boolean"  // 必填
    }
    ```
*   **响应 (Response):**
    *   **200 OK:** (同账号密码登录)
    *   **400 Bad Request:** (验证码错误或格式错误)
        ```json
        {
          "success": false,
          "message": "验证码不正确"
        }
        ```
    *   **404 Not Found:**
        ```json
        {
          "success": false,
          "message": "该手机号未注册，请先注册"
        }
        ```

## 2. 注册模块 (Registration)

### 2.1 注册第一步：验证手机号
*   **接口地址:** `POST /api/v1/auth/register/verify-phone`
*   **描述:** 校验手机号是否已注册，以及验证码是否正确。通过后返回临时凭证用于下一步。
*   **请求体 (Request Body):**
    ```json
    {
      "phoneNumber": "string", // 必填
      "code": "string",        // 必填
      "agreeTerms": "boolean"  // 必填
    }
    ```
*   **响应 (Response):**
    *   **200 OK:**
        ```json
        {
          "success": true,
          "verificationToken": "temp_token_xyz", // 用于第二步提交的凭证
          "message": "验证成功"
        }
        ```
    *   **409 Conflict:**
        ```json
        {
          "success": false,
          "message": "该手机号已注册，请直接登录"
        }
        ```
    *   **400 Bad Request:**
        ```json
        {
          "success": false,
          "message": "验证码错误"
        }
        ```

### 2.2 注册第二步：设置密码完成注册
*   **接口地址:** `POST /api/v1/auth/register/complete`
*   **描述:** 提交密码，完成注册流程。
*   **请求体 (Request Body):**
    ```json
    {
      "phoneNumber": "string",       // 必填
      "verificationToken": "string", // 必填，第一步返回的凭证
      "password": "string"           // 必填，8-20位字符
    }
    ```
*   **响应 (Response):**
    *   **201 Created:**
        ```json
        {
          "success": true,
          "token": "eyJhbG...", // 注册成功后自动登录
          "user": {
            "id": "u654321",
            "nickname": "新用户",
            "avatar": "default_avatar_url"
          }
        }
        ```
    *   **400 Bad Request:**
        ```json
        {
          "success": false,
          "message": "密码格式不符合要求" // 或 "凭证无效/过期"
        }
        ```
