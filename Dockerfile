# 构建阶段
FROM node:20.18.1 AS build
WORKDIR /app
ARG API_BASE_URL # 传入环境变量
ENV VUE_APP_API_BASE=$API_BASE_URL
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 运行阶段
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]