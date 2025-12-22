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
### Step 1. Web Constructor：构建网页UI前端
#### Step 1.0 构建首页prompt：
```
[EvoFlow\manual_prompt\login_register\web_constructor_step_0\homepage.png]
首页
```
#### Step 1.1 构建底边栏prompt：
```
[EvoFlow\manual_prompt\login_register\web_constructor_step_1\bottom_bar.png]
实现底边栏，该模块需要在所有页面中被添加至最低端
```
#### Step 1.2 构建登陆页prompt：
```
[EvoFlow\manual_prompt\login_register\web_constructor_step_2\login_overview.png]
[EvoFlow\manual_prompt\login_register\web_constructor_step_2\login_core.png]
登录界面
```
#### Step 1.3 构建注册页第一步prompt：
```
[EvoFlow\manual_prompt\login_register\web_constructor_step_3\register_overview.png]
[EvoFlow\manual_prompt\login_register\web_constructor_step_3\register_core1.png]
[EvoFlow\manual_prompt\login_register\web_constructor_step_3\register_core2.png]
注册界面第一步
```
#### Step 1.4 构建注册页第二步prompt：
```
[EvoFlow\manual_prompt\login_register\web_constructor_step_4\register2_overview.png]
[EvoFlow\manual_prompt\login_register\web_constructor_step_4\register2_core1.png]
[EvoFlow\manual_prompt\login_register\web_constructor_step_4\register2_core2.png]
注册界面第二步
```

### Step 2. Interface Designer：生成接口
```
请你根据需求文档#EvoFlow\requirements\login_register_requirement.md，设计登录与注册部分的接口
```

### Step 3. Test Generator：生成测试用例
```
请你根据登陆与注册的需求文档#EvoFlow\requirements\login_register_requirement.md，实现与Scenario一一对应的测试用例及测试代码
```

### Step 4. Developer：实现接口补全代码
```
请你根据登陆与注册的需求文档#EvoFlow\requirements\login_register_requirement.md，实现接口完成代码
```

### Step 5. Test Runner：运行测试用例
```
运行测试
```

### Step 6. 验证功能
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


### 用于最终提交 Step 7. AutoDebugger(未实现)


### 用于小组调试改进：Step 7. Workflow Refiner
这是一个用于改进工作流的agent。它了解整个工作流的所有步骤，并根据用户反馈和错误信息，自动调整工作流，使得下一次从零生成时能够避免该错误再次发生。

prompt：
```
{错误信息}+ “请你debug并改进工作流”
```
### 职责
#### 步骤 1: 代码层面的修复 (Immediate Fix)
*   **动作**: 分析报错信息或 Bug 描述，直接修改项目代码以修复当前问题。
*   **标准**: 确保修改后的代码能通过现有测试，并解决报告的 Bug。

#### 步骤 2: 根因分析 (Root Cause Analysis)
*   **动作**: 深度思考为什么之前的工作流没能避免这个 Bug。
*   **分析维度**:
    *   **需求模糊**: `requirements.md` 是否缺少了对该边缘情况或逻辑的描述？
    *   **提示词缺陷**: 某个 Agent 的 Prompt 是否不够明确？
        *   例如：Developer 忘记了做输入验证，可能是 `developer_prompt.md` 缺少了“必须验证所有输入”的强指令。
        *   例如：Test Generator 漏测了该场景，可能是 `test_generator_prompt.md` 缺乏对边界条件生成的指导。

#### 步骤 3: 系统进化 (Evolution for Reproducibility) - **最关键步骤**
*   **目标**: 确保如果其他人拿着**修改后的** `requirements.md` 和 `agent_prompts/` 重新从头运行工作流，这个 Bug **绝对不会**再次发生。
*   **动作**:
    *   **修改需求**: 如果是业务逻辑缺失，更新 `requirements.md`。
    *   **优化 Prompt**: 如果是 Agent 的能力或执行力问题，你必须修改 `agent_prompts/` 下对应的 `.md` 文件。
        *   *策略*: 增加特定的约束（Constraint）、思维链（Chain of Thought）示例或具体的“负面约束（Negative Constraints）”来指导 Agent。

#### 步骤 4: 测试闭环 (Test Coverage & Synchronization)
*   **动作**:
    1.  在 `requirements.md` 中添加或修改对应的“测试场景（Scenario）”描述（自然语言）。
    2.  编写或更新对应的自动化测试代码，确保该 Bug 被永久覆盖。
*   **约束**: 必须保持 `requirements.md` 中的描述与实际测试代码的一一对应关系。
