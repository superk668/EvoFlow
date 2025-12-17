# A Step-by-Step Guide to reproduce the Ctrip-Replica Project

![Badge](https://img.shields.io/badge/GitHub%20Pages-passing-brightgreen) ![License](https://img.shields.io/badge/license-MulanPSL--2.0-blue) ![Release](https://img.shields.io/badge/release-v23.03.1-blue)

本仓库作为'https://github.com/superk668/Ctrip-Replica'的子仓库，旨在提供一个标准化的multi-agent工作流，用于完全复现我们的工作。

## 关于我们的工作流

### 工作流介绍


### 帮助我们改进工作流


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

### 登陆与注册界面

对于所有[.png],请根据路径将其复制（拖曳）至prompt输入栏内。所有截图均可在`manual_prompt/`目录下找到。
Step 1. Web Constructor：构建网页UI前端
Step 1.0 构建首页prompt：
```
[EvoFlow\manual_prompt\login_register\web_constructor_step_0\homepage.png]
首页
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
登录界面
```
Step 1.3 构建注册页第一步prompt：
```
[EvoFlow\manual_prompt\login_register\web_constructor_step_3\register_overview.png]
[EvoFlow\manual_prompt\login_register\web_constructor_step_3\register_core1.png]
[EvoFlow\manual_prompt\login_register\web_constructor_step_3\register_core2.png]
注册界面第一步
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
请你根据登陆与注册的需求文档#EvoFlow\requirements\login_register_requirement.md，实现与Scenario一一对应的测试用例及测试代码
```

Step 4. Developer：实现接口补全代码
```
请你根据登陆与注册的需求文档#EvoFlow\requirements\login_register_requirement.md，实现接口完成代码
```

Step 5. Test Runner：运行测试用例
```
运行测试
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
进行测试

用于最终提交：
Step 7. AutoDebugger(未实现)

用于小组调试改进：
Step 7. 
