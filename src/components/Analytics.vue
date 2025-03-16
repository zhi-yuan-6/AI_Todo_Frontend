<template>
    <div class="analytics-container">
        <!-- 页面标题 -->
        <div class="page-title">
            <h1>数据分析看板</h1>
        </div>

        <!-- 时间范围选择器 -->
        <div class="time-range-selector">
            <el-card shadow="never">
                <template #header>
                    <span>选择时间范围</span>
                </template>
                <el-row :gutter="20">
                    <el-col :span="11">
                        <el-date-picker v-model="timeRange.start" type="date" placeholder="选择开始日期" format="YYYY-MM-DD"
                            value-format="YYYY-MM-DD" style="width: 100%" />
                    </el-col>
                    <el-col :span="11">
                        <el-date-picker v-model="timeRange.end" type="date" placeholder="选择结束日期" format="YYYY-MM-DD"
                            value-format="YYYY-MM-DD" style="width: 100%" />
                    </el-col>
                    <el-col :span="2">
                        <el-select v-model="timeRange.interval" placeholder="时间间隔" style="width: 100%">
                            <el-option label="周" value="week" />
                            <el-option label="月" value="month" />
                            <el-option label="年" value="year" />
                        </el-select>
                    </el-col>
                </el-row>
                <div style="margin-top: 15px; text-align: center">
                    <el-button type="primary" @click="fetchData">查询</el-button>
                </div>
            </el-card>
        </div>

        <!-- 图表展示区域 -->
        <div class="charts-container">
            <el-row :gutter="20">
                <!-- 趋势图 -->
                <el-col :span="24">
                    <el-card shadow="hover">
                        <template #header>
                            <span>任务完成趋势</span>
                        </template>
                        <div ref="trendChart" class="chart"></div>
                    </el-card>
                </el-col>

                <!-- 分类分布图和热力图 -->
                <el-col :span="12">
                    <el-card shadow="hover">
                        <template #header>
                            <span>任务分类分布</span>
                        </template>
                        <div ref="categoryChart" class="chart"></div>
                    </el-card>
                </el-col>
                <el-col :span="12">
                    <el-card shadow="hover">
                        <template #header>
                            <span>用户活跃时段</span>
                        </template>
                        <div ref="heatmapChart" class="chart"></div>
                    </el-card>
                </el-col>
            </el-row>
        </div>

        <!-- AI 分析报告区域 -->
        <div class="ai-analysis-section">
            <el-card shadow="never">
                <template #header>
                    <el-row justify="space-between">
                        <el-col :span="12">
                            <span>AI分析报告</span>
                        </el-col>
                        <el-col :span="12" style="text-align: right">
                            <el-button type="success" @click="generateAIReport">生成分析报告</el-button>
                        </el-col>
                    </el-row>
                </template>
                <!-- 在您的AI报告内容部分，确保使用v-html指令来渲染HTML内容 -->
                <div class="ai-report-content">
                    <!-- AI 分析报告内容区域 -->
                    <div v-if="aiReportLoading" class="ai-loading">
                        <el-skeleton :rows="10" animated />
                    </div>
                    <div v-else-if="aiReport" v-html="aiReport" class="ai-report-rendered"></div>
                    <div v-else class="ai-placeholder">
                        <p>点击上方按钮生成AI分析报告</p>
                    </div>
                </div>
            </el-card>
        </div>
    </div>
</template>

<script>
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';
import api from '@/services/api';

export default {
    name: 'Analytics',
    data() {
        return {
            timeRange: {
                start: null,
                end: null,
                interval: 'month'
            },
            trendChart: null,
            categoryChart: null,
            heatmapChart: null,
            aiReport: null,
            aiReportLoading: false,
            resizeHandler: null,  // 添加一个变量来存储resize处理函数的引用
            analyticsData: null   // 添加一个变量来存储API返回的数据
        };
    },
    mounted() {
        // 默认加载最近一个月的数据
        const currentDate = new Date();
        this.timeRange.end = this.formatDate(currentDate);
        currentDate.setDate(currentDate.getDate() - 30);
        this.timeRange.start = this.formatDate(currentDate);

        // 创建resize处理函数并保存引用
        this.resizeHandler = this.handleResize.bind(this);
        window.addEventListener('resize', this.resizeHandler);

        this.initCharts(); // 初始化图表然后再加载数据
        this.fetchData();
    },
    methods: {
        // 初始化图表
        initCharts() {
            // 确保DOM元素已渲染
            this.$nextTick(() => {
                if (this.$refs.trendChart && !this.trendChart) {
                    this.trendChart = echarts.init(this.$refs.trendChart);
                }
                if (this.$refs.categoryChart && !this.categoryChart) {
                    this.categoryChart = echarts.init(this.$refs.categoryChart);
                }
                if (this.$refs.heatmapChart && !this.heatmapChart) {
                    this.heatmapChart = echarts.init(this.$refs.heatmapChart);
                }
            });
        },

        // 强化resize处理逻辑
        handleResize() {
            this.$nextTick(() => {
                setTimeout(() => {
                    // 趋势图：检查是否已正确绑定到笛卡尔坐标系
                    if (this.trendChart &&
                        this.trendChart.getOption()?.series?.[0]?.coordinateSystem === 'cartesian2d' &&
                        !this.trendChart.getOption().polar // 确保未启用极坐标
                    ) {
                        try {
                            this.trendChart.resize();
                        } catch (error) {
                            console.error('趋势图 resize 失败:', error);
                        }
                    }

                    // 其他图表检查逻辑保持不变...
                }, 200); // 增加延迟确保DOM完全稳定
            });
        },

        // 添加格式化日期的方法
        formatDate(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },
        // 修改resize处理函数
        andleResize() {
            console.log('触发 resize，检查图表状态:', {
                trendChart: !!this.trendChart,
                hasTrendOption: this.trendChart && !!this.trendChart.getOption(),
                heatmapChart: !!this.heatmapChart,
                hasHeatmapOption: this.heatmapChart && !!this.heatmapChart.getOption()
            });

            this.$nextTick(() => {
                if (this.trendChart && this.trendChart.getOption()) {
                    try {
                        this.trendChart.resize();
                    } catch (error) {
                        console.error('趋势图 resize 失败:', error);
                        // 可选：尝试重新初始化
                        if (this.$refs.trendChart) {
                            this.trendChart.dispose();
                            this.trendChart = echarts.init(this.$refs.trendChart);
                            this.updateTrendChart(this.lastTrendData); // 假设保存了最后的数据
                        }
                    }
                }
                if (this.heatmapChart && this.heatmapChart.getOption()) {
                    try {
                        this.heatmapChart.resize();
                    } catch (error) {
                        console.error('热力图 resize 失败:', error);
                        if (this.$refs.heatmapChart) {
                            this.heatmapChart.dispose();
                            this.heatmapChart = echarts.init(this.$refs.heatmapChart);
                            this.updateHeatmapChart(this.lastHeatmapData); // 假设保存了最后的数据
                        }
                    }
                }
                if (this.categoryChart && this.categoryChart.getOption()) {
                    try {
                        this.categoryChart.resize();
                    } catch (error) {
                        console.error('分类图 resize 失败:', error);
                    }
                }
            });
        },
        async fetchData() {
            if (!this.timeRange.start || !this.timeRange.end) {
                ElMessage.warning('请选择完整的时间范围');
                return;
            }

            try {
                // 确保图表已初始化
                this.initCharts();

                const response = await api.analytics.getCombinedData({
                    start: this.timeRange.start,
                    end: this.timeRange.end,
                    interval: this.timeRange.interval
                });
                // 添加数据验证
                if (!response || typeof response !== 'object') {
                    throw new Error('API返回数据格式不正确');
                }
                // 保存API返回的数据
                this.analyticsData = response;
                this.updateCharts(response);
            } catch (error) {
                console.error('获取数据失败:', error);
                ElMessage.error('获取数据失败，请稍后重试');

                // 生成针对当前时间间隔的模拟数据
                let mockData = this.generateMockData(this.timeRange.interval);
                this.analyticsData = mockData; // 保存模拟数据
                this.updateCharts(mockData);
            }
        },

        // 添加一个根据时间间隔生成不同模拟数据的函数
        generateMockData(interval) {
            let labels, data;

            // 根据时间间隔生成不同的标签
            switch (interval) {
                case 'week':
                    labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
                    break;
                case 'month':
                    labels = ['第1周', '第2周', '第3周', '第4周'];
                    break;
                case 'year':
                    labels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
                    break;
                default:
                    labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
            }

            // 生成每个标签对应的随机数据
            const workData = labels.map(() => Math.floor(Math.random() * 30) + 10);
            const studyData = labels.map(() => Math.floor(Math.random() * 20) + 5);

            return {
                trend: {
                    labels: labels,
                    series: [
                        {
                            name: '工作',
                            data: workData,
                            color: '#5470c6'
                        },
                        {
                            name: '学习',
                            data: studyData,
                            color: '#91cc75'
                        }
                    ]
                },
                category_distribution: {
                    categories: [
                        { name: '工作', value: 45, color: '#5470c6' },
                        { name: '学习', value: 30, color: '#91cc75' },
                        { name: '生活', value: 15, color: '#fac858' },
                        { name: '健身', value: 10, color: '#ee6666' }
                    ]
                },
                heatmap: {
                    time_slots: Array.from({ length: 24 }, (_, i) => ({
                        time: `${String(i).padStart(2, '0')}:00`,
                        count: Math.floor(Math.random() * 20)
                    }))
                }
            };
        },

        updateCharts(data) {
            // 确保图表已初始化
            this.initCharts();

            this.$nextTick(() => {
                // 更新趋势图
                if (data && data.trend) {
                    this.updateTrendChart(data.trend);
                } else {
                    console.warn('趋势数据缺失');
                }

                // 更新分类分布图
                if (data && data.category_distribution) {
                    this.updateCategoryChart(data.category_distribution);
                } else {
                    console.warn('分类数据缺失');
                }

                // 更新热力图
                if (data && data.heatmap) {
                    this.updateHeatmapChart(data.heatmap);
                } else {
                    console.warn('热力图数据缺失');
                }
            });
        },

        updateTrendChart(trendData) {
            if (!this.$refs.trendChart) {
                console.warn('趋势图DOM引用不存在');
                return;
            }

            if (!trendData || !trendData.series || !trendData.labels) {
                console.warn('趋势图数据格式不正确', trendData);
                return;
            }

            // 检查 series 数据的完整性
            const isValid = trendData.series.every(s =>
                s.name &&
                Array.isArray(s.data) &&
                s.data.length > 0
            );
            if (!isValid) {
                console.warn('series 数据无效', trendData.series);
                return;
            }

            if (!this.trendChart) {
                console.log('初始化趋势图');
                this.trendChart = echarts.init(this.$refs.trendChart);
            }

            // 销毁旧实例并重新初始化
            if (this.trendChart) {
                this.trendChart.dispose();
                // this.trendChart = null;
            }
            this.trendChart = echarts.init(this.$refs.trendChart);

            // 确保数据格式正确
            const series = trendData.series.map(series => ({
                name: series.name,
                type: 'bar',
                coordinateSystem: 'cartesian2d', // 强制指定二维笛卡尔坐标系
                // stack: series.stack || 'total',
                xAxisIndex: 0,                   // 绑定到第一个x轴
                yAxisIndex: 0,                   // 绑定到第一个y轴
                stack: 'defaultStack',
                emphasis: {
                    focus: 'series'
                },
                data: series.data,
                itemStyle: {
                    color: series.color || undefined
                }
            }));
            //调试
            // console.log('trendData.series:', trendData.series);

            const option = {
                // 显式禁用极坐标组件
                polar: [],        // 空数组表示不初始化任何极坐标组件
                radiusAxis: null, // 禁用极坐标半径轴
                angleAxis: null,  // 禁用极坐标角度轴
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    }
                },
                legend: {
                    data: series.map(item => item.name)
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: trendData.labels
                },
                yAxis: {
                    type: 'value'
                },
                series: series
            };

            // console.log('设置趋势图选项:', option);

            try {
                this.trendChart.setOption(option, { replaceMerge: ['series'] });  // 使用true参数完全重置选项
            } catch (error) {
                console.error('趋势图设置选项失败:', error);
                // 尝试重新初始化图表
                if (this.trendChart) {
                    this.trendChart.dispose();
                }
                this.trendChart = echarts.init(this.$refs.trendChart);
                this.trendChart.setOption(option);
            }
        },

        updateCategoryChart(categoryData) {
            if (!this.$refs.categoryChart) {
                console.warn('分类图DOM引用不存在');
                return;
            }

            if (!categoryData || !categoryData.categories) {
                console.warn('分类图数据格式不正确', categoryData);
                return;
            }

            if (!this.categoryChart) {
                console.log('初始化分类图');
                this.categoryChart = echarts.init(this.$refs.categoryChart);
            }

            const option = {
                tooltip: {
                    trigger: 'item',
                    formatter: '{a} <br/>{b}: {c} ({d}%)'
                },
                legend: {
                    orient: 'vertical',
                    left: 'left',
                    data: categoryData.categories.map(item => item.name)
                },
                series: [
                    {
                        name: '任务分类',
                        type: 'pie',
                        radius: '55%',
                        center: ['50%', '60%'],
                        data: categoryData.categories.map(item => ({
                            value: item.value,
                            name: item.name,
                            itemStyle: {
                                color: item.color || undefined
                            }
                        })),
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    }
                ]
            };

            // console.log('设置分类图选项:', option);

            try {
                this.categoryChart.setOption(option, true);
            } catch (error) {
                console.error('分类图设置选项失败:', error);
                // 尝试重新初始化图表
                if (this.categoryChart) {
                    this.categoryChart.dispose();
                }
                this.categoryChart = echarts.init(this.$refs.categoryChart);
                this.categoryChart.setOption(option);
            }
        },
        updateHeatmapChart(heatmapData) {
            if (!this.$refs.heatmapChart || !heatmapData || !heatmapData.time_slots) {
                console.warn('热力图数据或DOM无效', heatmapData);
                return;
            }

            // 仅初始化一次实例
            if (!this.heatmapChart) {
                this.heatmapChart = echarts.init(this.$refs.heatmapChart);
            }

            const hours = Array.from({ length: 24 }, (_, i) => i);
            // const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
            const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

            const data = [];
            for (let i = 0; i < days.length; i++) {
                for (let j = 0; j < hours.length; j++) {
                    data.push([j, i, 0]); // y轴索引i必须小于days.length
                }
            }

            // heatmapData.time_slots.forEach(slot => {
            //     if (slot.time && typeof slot.count === 'number') {
            //         const hour = parseInt(slot.time.split(':')[0]);
            //         const day = 0; // 简化处理，固定为周一
            //         const index = data.findIndex(item => item[0] === hour && item[1] === day);
            //         if (index !== -1) {
            //             data[index][2] = slot.count;
            //         }
            //     }
            // });
            heatmapData.time_slots.forEach(slot => {
                const hour = parseInt(slot.time.split(':')[0]);
                const dayIndex = 0; // 根据实际数据调整

                if (hour >= 0 && hour < 24 && dayIndex < days.length) {
                    const index = dayIndex * 24 + hour;
                    if (index < data.length) {
                        data[index][2] = slot.count;
                    }
                }
            });

            const maxValue = Math.max(...data.map(item => item[2]), 1);

            const option = {
                tooltip: {
                    position: 'top',
                    formatter: params => `${hours[params.data[0]]}, ${days[params.data[1]]}: ${params.data[2]} 个任务`
                },
                grid: { left: '3%', right: '4%', bottom: '8%', containLabel: true },
                xAxis: { type: 'category', data: hours, splitArea: { show: true } },
                yAxis: { type: 'category', data: days, splitArea: { show: true } },
                visualMap: {
                    min: 0,
                    max: maxValue,
                    calculable: true,
                    orient: 'horizontal',
                    left: 'center',
                    bottom: '0%',
                    inRange: { color: ['#e0f3f8', '#045a8d'] }
                },
                series: [{
                    name: '任务数量',
                    type: 'heatmap',  // 明确指定类型
                    data: data,
                    label: { show: false },
                    emphasis: {
                        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' }
                    }
                }]
            };

            // console.log('设置热力图选项:', JSON.stringify(option, null, 2));
            this.heatmapChart.setOption(option, { replaceMerge: ['series'] });
        },

        // 在Vue组件中添加一个新方法来格式化AI报告
        // 改进的AI报告格式化函数
        formatAIReport(rawReport) {
            // 检查报告是否存在
            if (!rawReport) return '';

            // 清理输入：移除多余的引号并规范化换行符
            let cleanReport = rawReport.replace(/^"(.*)"$/s, '$1').replace(/\\n/g, '\n');

            // 处理Markdown-like格式
            let formattedReport = cleanReport
                // 一级标题 #，确保有内容
                .replace(/^# (.+?)(?:\n|$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4 text-blue-800">$1</h1>')
                // 二级标题 ##
                .replace(/^## (.+?)(?:\n|$)/gm, '<h2 class="text-xl font-bold mt-5 mb-3 text-blue-700">$1</h2>')
                // 三级标题 ###
                .replace(/^### (.+?)(?:\n|$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2 text-blue-600">$1</h3>')
                // 加粗文本
                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
                // 无序列表项（- 或 *），跳过空项
                .replace(/^\s*[-*]\s+(.+?)(?=\n|$)/gm, '\n<li class="ml-6 mb-2">$1</li>')
                // 有序列表项（1.）
                .replace(/^\s*(\d+)\.\s+(.+?)(?=\n|$)/gm, '\n<li class="ml-6 mb-2 list-decimal">$2</li>')
                // 将连续的<li>包装为<ul>或<ol>
                .replace(/(<li class="ml-6 mb-2 list-decimal">.*?<\/li>\n?)+/gs, '<ol class="list-decimal mb-4 pl-5">$&</ol>')
                .replace(/(<li class="ml-6 mb-2">.*?<\/li>\n?)+/gs, '<ul class="list-disc mb-4 pl-5">$&</ul>')
                // 段落（非标题、非列表的文本）
                .replace(/(?<=\n|^)(?!<[hou]|<li|\s*$)(.*?)(?=\n\n|\n<|$)/gs, '<p class="mb-3">$1</p>')
                // 图片占位符
                .replace(/!\[\]\((.*?)\)/g, '<div class="my-4 text-center"><img src="$1" alt="图表" class="mx-auto border rounded-lg shadow-sm" /></div>')
                // 规范化多余换行
                .replace(/\n{2,}/g, '\n\n')
                // 清理标签后的换行
                .replace(/>\n+/g, '>');

            // 包装为完整的报告容器
            formattedReport = `
  <div class="ai-report p-4 bg-white rounded-lg shadow">
    <h2 class="text-2xl font-bold mb-4 text-center text-blue-800">AI数据分析报告</h2>
    ${formattedReport.trim()}
    <div class="text-right text-sm text-gray-500 mt-4">生成时间: ${new Date().toLocaleString()}</div>
  </div>
`;

            return formattedReport;
        },
        // 在generateAIReport方法中添加错误处理和回退机制
        async generateAIReport() {
            if (!this.timeRange.start || !this.timeRange.end) {
                ElMessage.warning('请选择完整的时间范围');
                return;
            }

            this.aiReport = null;
            this.aiReportLoading = true;

            try {
                // 确保有数据可以传递
                if (!this.analyticsData) {
                    throw new Error('没有可用的分析数据，请先获取数据');
                }

                // 设置超时处理
                const response = await api.analytics.generateAIReport({
                    timeRange: {
                        start: this.timeRange.start,
                        end: this.timeRange.end,
                        interval: this.timeRange.interval
                    },
                    analyticsData: this.analyticsData  // 传递之前保存的数据
                }).catch(error => {
                    // 检查是否是超时错误
                    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                        console.warn('AI报告生成超时，切换到本地生成模式');
                        return {
                            report: this.generateLocalAIReport()
                        };
                    }
                    // 其他错误直接抛出
                    throw error;
                });

                const reportContent = response.data
                if (reportContent) {
                    this.aiReport = this.formatAIReport(reportContent);
                } else {
                    console.warn('API返回的报告数据格式不正确', response)
                    this.aiReport = this.generateLocalAIReport();
                }
                this.aiReportLoading = false;
            } catch (error) {
                console.error('生成AI报告失败:', error);
                ElMessage.error(`生成AI报告失败: ${error.message}`);
                this.aiReportLoading = false;

                // 在错误情况下也提供一个基本报告
                setTimeout(() => {
                    this.aiReport = this.formatAIReport(this.generateLocalAIReport());
                }, 500);
            }
        },

        // 添加一个新方法来生成本地AI报告
        generateLocalAIReport() {
            // 基于当前已有的analyticsData数据生成一个简单的报告
            const data = this.analyticsData;
            let reportContent = `
        <h3>数据分析报告</h3>
        <p><strong>时间范围:</strong> ${this.timeRange.start} 至 ${this.timeRange.end}</p>
    `;

            // 如果有趋势数据，添加趋势分析
            if (data && data.trend && data.trend.series) {
                const series = data.trend.series;
                let trendText = '<h4>趋势分析:</h4><p>';

                // 对每个系列计算平均值和变化趋势
                series.forEach(s => {
                    if (s.data && s.data.length > 1) {
                        const avg = s.data.reduce((sum, val) => sum + val, 0) / s.data.length;
                        const trend = s.data[s.data.length - 1] > s.data[0] ? '上升' : '下降';
                        trendText += `${s.name}任务平均完成量为${avg.toFixed(1)}，整体呈${trend}趋势。`;
                    }
                });

                trendText += '</p>';
                reportContent += trendText;
            }

            // 如果有分类数据，添加分类分析
            if (data && data.category_distribution && data.category_distribution.categories) {
                const categories = data.category_distribution.categories;
                let categoryText = '<h4>分类分析:</h4><p>';

                // 找出最高占比的分类
                const maxCategory = categories.reduce((prev, current) =>
                    (prev.value > current.value) ? prev : current, { value: 0 });

                categoryText += `${maxCategory.name}类任务占比最高，达到${maxCategory.value}%。`;

                // 添加建议
                categoryText += '建议保持任务类型的多样性，保持生活和工作的平衡。</p>';
                reportContent += categoryText;
            }

            // 如果有热力图数据，添加活跃时段分析
            if (data && data.heatmap && data.heatmap.time_slots) {
                const timeSlots = data.heatmap.time_slots;
                let heatmapText = '<h4>活跃时段分析:</h4><p>';

                // 找出活跃度最高的时段
                const maxTimeSlot = timeSlots.reduce((prev, current) =>
                    (prev.count > current.count) ? prev : current, { count: 0 });

                heatmapText += `用户活跃高峰集中在${maxTimeSlot.time}前后。建议在这段时间安排重要任务以提高效率。</p>`;
                reportContent += heatmapText;
            }

            // 添加总结建议
            reportContent += `
        <h4>建议:</h4>
        <ul>
            <li>合理安排任务时间，充分利用高效工作时段</li>
            <li>平衡不同类型的任务，避免单一类型任务过多</li>
            <li>定期分析任务完成情况，持续优化时间管理策略</li>
        </ul>
        `;

            return reportContent;
        }
    },
    beforeUnmount() {
        // 移除resize事件监听器
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }

        // 正确处理图表的销毁
        if (this.trendChart) {
            this.trendChart.dispose();
            this.trendChart = null;
        }

        if (this.categoryChart) {
            this.categoryChart.dispose();
            this.categoryChart = null;
        }

        if (this.heatmapChart) {
            this.heatmapChart.dispose();
            this.heatmapChart = null;
        }
    }
};
</script>

<style scoped>
.analytics-container {
    padding: 20px;
}

.page-title {
    margin-bottom: 20px;
    text-align: center;
}

.time-range-selector {
    margin-bottom: 20px;
}

.charts-container {
    margin-bottom: 20px;
}

.chart {
    height: 400px;
    width: 100%;
}

.ai-analysis-section {
    margin-top: 20px;
}

.ai-report-content {
    min-height: 300px;
    padding: 20px;
}

.ai-placeholder {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #999;
}

.ai-loading {
    padding: 20px;
}

/* 添加到现有的<style>标签中 */
.ai-report {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 100%;
    margin: 0 auto;
}

.ai-report h2 {
    color: #1a56db;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #e5e7eb;
}

.ai-report h3 {
    color: #2563eb;
    margin-top: 1.5rem;
}

.ai-report h4 {
    color: #3b82f6;
    margin-top: 1.25rem;
}

.ai-report p {
    margin-bottom: 1rem;
}

.ai-report ul,
.ai-report ol {
    margin-bottom: 1.5rem;
    padding-left: 1.5rem;
}

.ai-report li {
    margin-bottom: 0.5rem;
}

.ai-report img {
    max-width: 100%;
    height: auto;
    border-radius: 0.375rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

/* 为图表添加占位符样式 */
.ai-report img[src*="placeholder"] {
    background-color: #f9fafb;
    padding: 1rem;
    border: 1px dashed #cbd5e1;
    max-width: 90%;
    margin: 1rem auto;
}

/* 打印样式 */
@media print {
    .ai-report {
        page-break-inside: avoid;
        max-width: 100% !important;
    }

    .ai-report h2,
    .ai-report h3,
    .ai-report h4 {
        page-break-after: avoid;
    }

    .ai-report ul,
    .ai-report ol {
        page-break-before: avoid;
    }
}
</style>