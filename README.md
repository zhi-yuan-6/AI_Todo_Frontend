# AI Todo Frontend

## 项目简介

AI Todo Frontend 是一个基于现代前端技术栈开发的项目，旨在为用户提供一个高效、直观的待办事项管理界面。通过该项目，您可以轻松地创建、编辑和管理您的待办事项。

## 先决条件

在开始之前，请确保您的系统已安装以下工具：

- [Node.js](https://nodejs.org/ )（建议版本 20.x 或更高）
- [npm](https://www.npmjs.com/ )（通常随 Node.js 一起安装）
- [Docker](https://www.docker.com/ )（如果您选择使用 Docker 部署）
- [Git](https://git-scm.com/ )（用于克隆项目代码）

## 安装和运行

您可以通过以下两种方式安装并运行项目：

### 方式一：使用 npm

适合本地开发和测试。

1. **克隆项目代码**

   ```bash
   git clone https://github.com/zhi-yuan-6/AI_Todo_Frontend.git
   ```

   或者，您也可以直接下载项目的zip文件：[点击此处下载zip文件](https://github.com/zhi-yuan-6/AI_Todo_Frontend/archive/refs/heads/main.zip)

2. **进入项目目录**

   ```bash
   cd AI_Todo_Frontend
   ```

3. **安装依赖**

   ```bash
   npm install
   ```

4. **运行开发服务器**

   ```bash
   npm run dev
   ```

   项目将在 `http://localhost:5173` 上运行，您可以通过浏览器访问该地址查看应用。

### 方式二：使用 Docker

适合快速部署或生产环境。

1. **拉取 Docker 镜像**

   ```bash
   docker pull zhhiyuan/aitodofrontend:latest
   ```

2. **运行 Docker 容器**

   ```bash
   docker run -d -p 5173:80 zhhiyuan/aitodofrontend:latest
   ```

   容器将在后台运行，并将内部的 80 端口映射到主机的 5173 端口。完成后，您可以通过浏览器访问 `http://localhost:5173` 查看应用。


## 常见问题

- **npm install 失败**：请检查 Node.js 版本是否兼容，并确保网络连接正常。
- **端口被占用**：如果 5173 端口已被使用，可以在 `docker run` 命令中修改端口，例如 `-p 5174:80`。

## 贡献指南

我们欢迎社区贡献！如果您想参与项目开发，请按照以下步骤操作：

1. Fork 本仓库。
2. 创建一个新分支（`git checkout -b feature/YourFeature`）。
3. 提交您的更改（`git commit -m 'Add some feature'`）。
4. 推送到远程分支（`git push origin feature/YourFeature`）。
5. 在 GitHub 上提交 Pull Request。

## 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 联系方式

如果您有任何问题或建议，欢迎通过以下方式联系：

- 电子邮件：16655836875@163.com
- GitHub Issues：[https://github.com/zhi-yuan-6/AI_Todo_Frontend/issues](https://github.com/zhi-yuan-6/AI_Todo_Frontend/issues)