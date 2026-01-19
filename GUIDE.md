# A Step-by-Step Guide to reproduce the Ctrip-Replica Project

![Badge](https://img.shields.io/badge/GitHub%20Pages-passing-brightgreen) ![License](https://img.shields.io/badge/license-MulanPSL--2.0-blue) ![Release](https://img.shields.io/badge/release-v23.03.1-blue)

本仓库作为'https://github.com/superk668/Ctrip-Replica'的子仓库，旨在提供一个标准化的multi-agent工作流，用于完全复现我们的工作。

## 开始复现

### 准备工作
本工作流使用Trae作为multi-agent平台，你可以通过以下方式导入agent：

1. 导入agent
方式1：通过trae链接导入agent
To be added (Under construction)

方式2: 手动添加
所有agent的prompt均可在`agent_prompt/`目录下找到。
注意：请在agent创建界面打开所有工具的权限复选框，确保agent可以使用所有功能。

2. 准备文件
在本仓库中，已为你准备好所有复现需要的文件，文件树如下。

3. 额外说明
对于所有agent，我们均使用`GPT-5.2`作为模型，不对其他模型的性能做出保证。

在agent运行过程中，请保持关注。在agent自主运行`npm test`时，终端可能无法正常退出，请在agent运行终端运行完成后手动点击跳过键或在终端中键入`q`退出。

在每个板块的Web constructor阶段，我们需要使用图片输入，需要agent的多模态理解能力。但我们发现trae提供的模型有时会出现无法理解图片的“降智”现象，具体表现为尝试创建python程序使用OCR理解图片，这会对我们的工作流的性能产生严重影响。如遇到这种情况，请尝试新建任务或重启Trae，确保agent能正确理解图片。

在所有端口初始化时，若报错，请先检查该端口是否已被占用。

对于所有[.png]文件，请根据路径将其复制（拖曳）至prompt输入栏内。所有截图均可在`manual_prompt/`目录下找到。我们尝试了自动化的版本，但效果不佳，因此仍选择手动拖入的方式，对其带来的不便表示歉意。

### 登陆与注册界面

Step 1. Web Constructor：构建网页UI前端
Step 1.0 构建首页prompt：
```
[EvoFlow\manual_prompt\login_register\web_constructor_step_0\homepage.png]
[EvoFlow\manual_prompt\login_register\web_constructor_step_0\after_login.png]
构建未登录的首页和登录后的首页（登陆注册按钮变为用户头像和昵称）
```
Step 1.1 构建底边栏prompt：
```
[EvoFlow\manual_prompt\login_register\web_constructor_step_1\bottom_bar.png]
实现底边栏，该模块需要在所有页面中被添加至最低端
```
Step 1.2 构建登陆页prompt：
```
[EvoFlow\manual_prompt\login_register\web_constructor_step_2\login_overview.png]
[EvoFlow\manual_prompt\login_register\web_constructor_step_2\login_core.png]
[EvoFlow\manual_prompt\login_register\web_constructor_step_2\login_sms_core.png]
登录界面，使用两种登陆方式分为账户名密码登录和验证码登录，可以通过按钮互相跳转
```
Step 1.3 构建注册页第一步prompt：
```
[EvoFlow\manual_prompt\login_register\web_constructor_step_3\register_overview.png]
[EvoFlow\manual_prompt\login_register\web_constructor_step_3\register_core1.png]
[EvoFlow\manual_prompt\login_register\web_constructor_step_3\register_core2.png]
[EvoFlow\manual_prompt\login_register\web_constructor_step_3\register_contract.png]
注册界面第一步。其中，用户协议是刚进入该页面时的弹窗，点击同意后进入注册界面，否则跳转首页。
```
Step 1.4 构建注册页第二步prompt：
```
[EvoFlow\manual_prompt\login_register\web_constructor_step_4\register2_overview.png]
[EvoFlow\manual_prompt\login_register\web_constructor_step_4\register2_core1.png]
[EvoFlow\manual_prompt\login_register\web_constructor_step_4\register2_core2.png]
注册界面第二步
```

Step 2. Interface Designer：生成接口
```
请你根据需求文档#EvoFlow\requirements\login_register_requirement.md，设计登录与注册部分的接口
```

Step 3. Test Generator：生成测试用例
```
请你根据登陆与注册的需求文档#EvoFlow\requirements\login_register_requirement.md，实现与Scenario一一对应的测试用例及测试代码,无需使所有测试样例通过
```

Step 4. Developer：实现接口补全代码
```
请你根据登陆与注册的需求文档#EvoFlow\requirements\login_register_requirement.md，实现接口完成设计登录与注册部分的代码
```

Step 5. Test Runner：运行测试用例
```
请你进行测试，同时确保后端可通过npm start正常启动并在某端口上等待并且能够在控制台打印发送的验证码，前端能通过npm run dev 正常启动。
请你验证刚启动后端时处于未登录状态，主页为未登录版式。
请你验证登陆后，登录状态成功保存并跳转至已登录的主页版式。
请你检查路由：各界面间能否通过点击链接或按钮跳转。
```

Step 6. 验证功能
现在可以对登录与注册功能进行验证。
启动后端
```
cd backend
npm start
```
启动前端
```
cd frontend
npm run dev
```
进行测试。
若遇到严重问题，请向developer反馈，要求其修复。

在端口初始化时，若报错，请先检查该端口是否已被占用。

### 个人中心板块

Step 1. Web Constructor
Step 1.1 构建个人信息管理页prompt：
```
[EvoFlow\manual_prompt\personal_center\web_constructor_step1\personal_center_page.png]
[EvoFlow\manual_prompt\personal_center\web_constructor_step1\Dropdown_menu.png]
构建个人信息管理页及左侧可下拉展开的导航栏。
```

```
[EvoFlow\manual_prompt\personal_center\web_constructor_step1\information_edit.png]
构建个人信息管理页点击编辑后进入的个人信息编辑页面。
```

Step 1.2 构建常用旅客信息管理页prompt：
```
[EvoFlow\manual_prompt\personal_center\web_constructor_step2\common_information_page.png]
[EvoFlow\manual_prompt\personal_center\web_constructor_step2\dropdown_menu.png]
构建常用旅客信息管理页
```

Step 1.3 构建常用旅客信息编辑页prompt：
```
[EvoFlow\manual_prompt\personal_center\web_constructor_step3\set_information.png]
构建常用旅客信息编辑页
```


Step 2. Interface Designer：生成接口
```
请你根据需求文档#EvoFlow\requirements\personal_center_requirement.md，设计个人中心板块的接口
```

Step 3. Test Generator：生成测试用例
```
请你根据个人中心的需求文档#EvoFlow\requirements\personal_center_requirement.md，实现与Scenario一一对应的测试用例及测试代码,无需使所有测试样例通过
```

Step 4. Developer：实现接口补全代码
```
请你根据个人中心的需求文档#EvoFlow\requirements\personal_center_requirement.md，实现接口完成设计个人中心板块的代码
```

Step 5. Test Runner：运行测试用例
```
请你进行测试，同时确保后端可通过npm start正常启动，并可在个人信息/旅客信息编辑时前端输入栏中输入合法信息进行保存时，后端可正确记录保存数据，同时前端能通过npm run dev 正常启动。
请你验证各页面之间的跳转是否正常，能够在已登录的主页点击用户昵称头像跳转至个人信息管理页。
```

Step 6. 验证功能
现在可以对个人中心板块的功能进行验证。
启动后端
```
cd backend
npm start
```
启动前端
```
cd frontend
npm run dev
```
进行测试。
若遇到严重问题，请向developer反馈，要求其修复。

在端口初始化时，若报错，请先检查该端口是否已被占用。

### 机票预订板块

Step 1. Web Constructor
Step 1.1 构建机票预订搜索结果页prompt：
```
[EvoFlow\manual_prompt\buy_ticket\web_constructor_step_0\search_result_overview.png]
[EvoFlow\manual_prompt\buy_ticket\web_constructor_step_0\searching_bar.png]
[EvoFlow\manual_prompt\buy_ticket\web_constructor_step_0\selecting_bar.png]
[EvoFlow\manual_prompt\buy_ticket\web_constructor_step_0\ticket_pulldown_selection.png]
[EvoFlow\manual_prompt\buy_ticket\web_constructor_step_0\booking_button.png]
通过在主页（homepage）进行搜索进入搜索结果页面。请检查主页搜索栏构建（出发地下拉选择框，目的地下拉选择框，日期选择框）。构建搜索结果页面，具体航班信息使用日期、出发地和目的地随搜索改变的半硬编码。 构建搜索结果页面的搜索栏，点击出发地和目的地城市名会出现选择栏，构建出发地和目的地选择下拉栏，如果使用 useSearchParams，请先证明它不会改变 pathname；否则改用 useNavigate，添加交互路由。 构建筛选/排序栏。 构建搜索结果机票信息卡的订票展开按钮，点击后展开下拉面板，添加交互路由。
```

Step 1.2 构建订票第一步页面prompt：
```
[EvoFlow\manual_prompt\buy_ticket\web_constructor_step_1\buy_ticket_step1.png]
[EvoFlow\manual_prompt\buy_ticket\web_constructor_step_1\passenger.png]
[EvoFlow\manual_prompt\buy_ticket\web_constructor_step_1\contacts.png]
[EvoFlow\manual_prompt\buy_ticket\web_constructor_step_1\ticket_information.png]
构建订票第一步页面，包含乘客信息卡，联系人信息和机票信息展示。
```

Step 1.3 构建订票第二步页面prompt：
```
[EvoFlow\manual_prompt\buy_ticket\web_constructor_step_2\buy_ticket_step2.png]
[EvoFlow\manual_prompt\buy_ticket\web_constructor_step_2\go_pay.png]
[EvoFlow\manual_prompt\buy_ticket\web_constructor_step_2\ticket_information.png]
构建订票第二步页面，包含顶部的保障展示，底部的“去支付”按钮和机票信息卡展示。
```

Step 1.4 构建订票第三步页面prompt：
```
[EvoFlow\manual_prompt\buy_ticket\web_constructor_step_3\buy_ticket_step3.png]
[EvoFlow\manual_prompt\buy_ticket\web_constructor_step_3\pay_selection.png]
构建订票第三步支付页面。
```

Step 1.5 构建订票第四步页面prompt：
```
构建订票第四步支付完成页面，显示“支付完成”的提示和机票信息。
```

Step 2. Interface Designer：生成接口
```
请你根据需求文档#EvoFlow\requirements\buy_ticket_requirement.md，设计机票预订板块的接口
```

Step 3. Test Generator：生成测试用例
```
请你根据机票预订的需求文档#EvoFlow\requirements\buy_ticket_requirement.md，实现与Scenario一一对应的测试用例及测试代码,无需使所有测试样例通过。
```

Step 4. Developer：实现接口补全代码
```
请你根据机票预订的需求文档#EvoFlow\requirements\buy_ticket_requirement.md，实现接口完成设计机票预订板块的代码
```

Step 5. Test Runner：运行测试用例
```
请你进行测试，同时确保后端可通过npm start正常启动，并可在机票预订/乘客信息编辑时前端输入栏中输入合法信息进行保存时，或在机票下单成功后，后端可正确记录保存订单数据，同时前端能通过npm run dev 正常启动。
请你验证各页面之间的跳转是否正常，能够在主页使用搜索功能跳转至机票搜索页。
```

Step 6. 验证功能
现在可以对机票预订板块的功能进行验证。
启动后端
```
cd backend
npm start
```
启动前端
```
cd frontend
npm run dev
```
进行测试。
若遇到严重问题，请向developer反馈，要求其修复。

在端口初始化时，若报错，请先检查该端口是否已被占用。