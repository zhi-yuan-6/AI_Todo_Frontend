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
                <!-- Header部分 -->
                <template #header>
                    <el-row justify="space-between">
                        <el-col :span="12">
                            <span>AI分析报告</span>
                        </el-col>
                        <el-col :span="12" style="text-align: right">
                            <!-- 生成按钮 -->
                            <el-button type="success" @click="generateAIReport" :disabled="aiReportLoading">
                                {{ aiReportLoading ? '生成中...' : '生成分析报告' }}
                            </el-button>
                        </el-col>
                    </el-row>
                </template>

                <!-- 内容区域 -->
                <div class="ai-report-content" ref="reportContainer">
                    <div v-if="aiReportLoading" class="ai-loading">
                        <el-skeleton :rows="5" animated />
                        <div class="streaming-indicator">
                            <div class="dot-flashing"></div>
                            <span>AI正在生成中...</span>
                        </div>
                    </div>
                    <!-- 修改显示逻辑 -->
                    <div v-else-if="tempReport || aiReport" class="ai-report-rendered"
                        v-html="formatAIReport(tempReport || aiReport)" style="white-space: pre-wrap">
                    </div>
                    <div v-else class="ai-placeholder">
                        <p>点击上方按钮生成分析报告</p>
                    </div>
                </div>
            </el-card>
        </div>
    </div>
</template>

<script>
import * as echarts from 'echarts';
import { ElMessage, parseDate } from 'element-plus';
import api from '@/services/api';
// 新增导入
import { useAnalyticsStore } from '@/stores/analytics'
import { storeToRefs } from 'pinia'

export default {
    name: 'Analytics',
    data() {
        //初始化store
        const analyticsStore = useAnalyticsStore()
        //解构需要相应的store属性
        const { aiReport, lastQueryParams } = storeToRefs(analyticsStore)
        return {
            timeRange: {
                start: null,
                end: null,
                interval: 'month'
            },
            trendChart: null,
            categoryChart: null,
            heatmapChart: null,
            // aiReport: '',
            aiReportLoading: false,
            resizeHandler: null,
            analyticsData: null,
            // 添加变量存储最后使用的数据，方便图表重新初始化时使用
            lastTrendData: null,
            lastCategoryData: null,
            lastHeatmapData: null,

            analyticsStore,
            aiReport,
            lastQueryParams,
            tempReport: '',
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

        this.$nextTick(() => {
            this.initCharts(); // 初始化图表
            this.fetchData();  // 加载数据
        });
        if (this.lastQueryParams) {
            this.timeRange = { ...this.lastQueryParams }
        }
    },
    methods: {
        /** 
         * 初始化所有图表
         */
        initCharts() {
            // 确保DOM元素已渲染
            if (this.$refs.trendChart && !this.trendChart) {
                this.trendChart = echarts.init(this.$refs.trendChart);
            }
            if (this.$refs.categoryChart && !this.categoryChart) {
                this.categoryChart = echarts.init(this.$refs.categoryChart);
            }
            if (this.$refs.heatmapChart && !this.heatmapChart) {
                this.heatmapChart = echarts.init(this.$refs.heatmapChart);
            }
        },

        /**
         * 处理窗口大小变化事件
         */
        handleResize() {
            // 使用防抖函数更高效地处理resize事件
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }

            this.resizeTimeout = setTimeout(() => {
                this.$nextTick(() => {
                    // 重新调整图表大小
                    this.resizeChart(this.trendChart);
                    this.resizeChart(this.categoryChart);
                    this.resizeChart(this.heatmapChart);
                });
            }, 200);
        },

        /**
         * 安全地调整图表大小
         * @param {Object} chart - ECharts实例
         */
        resizeChart(chart) {
            if (chart && chart.resize) {
                try {
                    chart.resize();
                } catch (error) {
                    console.error('图表resize失败:', error);
                    // 图表resize失败时尝试重建图表
                    this.rebuildCharts();
                }
            }
        },

        /**
         * 重建所有图表
         */
        rebuildCharts() {
            // 趋势图
            if (this.$refs.trendChart && this.lastTrendData) {
                if (this.trendChart) {
                    this.trendChart.dispose();
                }
                this.trendChart = echarts.init(this.$refs.trendChart);
                this.updateTrendChart(this.lastTrendData);
            }

            // 分类图
            if (this.$refs.categoryChart && this.lastCategoryData) {
                if (this.categoryChart) {
                    this.categoryChart.dispose();
                }
                this.categoryChart = echarts.init(this.$refs.categoryChart);
                this.updateCategoryChart(this.lastCategoryData);
            }

            // 热力图
            if (this.$refs.heatmapChart && this.lastHeatmapData) {
                if (this.heatmapChart) {
                    this.heatmapChart.dispose();
                }
                this.heatmapChart = echarts.init(this.$refs.heatmapChart);
                this.updateHeatmapChart(this.lastHeatmapData);
            }
        },

        /**
         * 格式化日期为YYYY-MM-DD格式
         * @param {Date} date - 日期对象
         * @returns {string} 格式化后的日期字符串
         */
        formatDate(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },

        /**
         * 获取数据并更新图表
         */
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

                // 数据验证
                if (!response || typeof response !== 'object') {
                    throw new Error('API返回数据格式不正确');
                }

                // 保存API返回的数据
                this.analyticsData = response;
                this.updateCharts(response);
            } catch (error) {
                console.error('获取数据失败:', error);
                ElMessage.error('获取数据失败，请稍后重试');

                // 生成模拟数据
                const mockData = this.generateMockData(this.timeRange.interval);
                this.analyticsData = mockData;
                this.updateCharts(mockData);
            }
        },

        /**
         * 根据时间间隔生成模拟数据
         * @param {string} interval - 时间间隔 (week/month/year)
         * @returns {Object} 模拟数据对象
         */
        generateMockData(interval) {
            let labels;

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

            // 生成随机数据
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

        /**
         * 更新所有图表
         * @param {Object} data - 图表数据
         */
        updateCharts(data) {
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

        /**
         * 更新趋势图
         * @param {Object} trendData - 趋势图数据
         */
        updateTrendChart(trendData) {
            // 保存数据用于重新初始化
            this.lastTrendData = trendData;

            if (!this.$refs.trendChart) {
                console.warn('趋势图DOM引用不存在');
                return;
            }

            if (!trendData || !trendData.series || !trendData.labels) {
                console.warn('趋势图数据格式不正确', trendData);
                return;
            }

            // 检查数据有效性
            const isValid = trendData.series.every(s =>
                s.name && Array.isArray(s.data) && s.data.length > 0
            );

            if (!isValid) {
                console.warn('趋势图series数据无效', trendData.series);
                return;
            }

            // 确保图表已初始化
            if (!this.trendChart) {
                this.trendChart = echarts.init(this.$refs.trendChart);
            }

            // 转换数据为图表所需格式
            const series = trendData.series.map(series => ({
                name: series.name,
                type: 'bar',
                coordinateSystem: 'cartesian2d',
                stack: 'defaultStack',
                emphasis: {
                    focus: 'series'
                },
                data: series.data,
                itemStyle: {
                    color: series.color || undefined
                }
            }));

            const option = {
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

            try {
                this.trendChart.setOption(option, { replaceMerge: ['series'] });
            } catch (error) {
                console.error('趋势图设置选项失败:', error);
                // 重新初始化图表
                this.trendChart.dispose();
                this.trendChart = echarts.init(this.$refs.trendChart);
                this.trendChart.setOption(option);
            }
        },

        /**
         * 更新分类分布图
         * @param {Object} categoryData - 分类图数据
         */
        updateCategoryChart(categoryData) {
            // 保存数据用于重新初始化
            this.lastCategoryData = categoryData;

            if (!this.$refs.categoryChart) {
                console.warn('分类图DOM引用不存在');
                return;
            }

            if (!categoryData || !categoryData.categories) {
                console.warn('分类图数据格式不正确', categoryData);
                return;
            }

            // 确保图表已初始化
            if (!this.categoryChart) {
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

            try {
                this.categoryChart.setOption(option);
            } catch (error) {
                console.error('分类图设置选项失败:', error);
                // 重新初始化图表
                this.categoryChart.dispose();
                this.categoryChart = echarts.init(this.$refs.categoryChart);
                this.categoryChart.setOption(option);
            }
        },

        /**
         * 更新热力图
         * @param {Object} heatmapData - 热力图数据
         */
        updateHeatmapChart(heatmapData) {
            // 保存数据用于重新初始化
            this.lastHeatmapData = heatmapData;

            if (!this.$refs.heatmapChart || !heatmapData || !heatmapData.time_slots) {
                console.warn('热力图数据或DOM无效', heatmapData);
                return;
            }

            // 确保图表已初始化
            if (!this.heatmapChart) {
                this.heatmapChart = echarts.init(this.$refs.heatmapChart);
            }

            const hours = Array.from({ length: 24 }, (_, i) => i);
            const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

            // 初始化数据矩阵
            const data = [];
            for (let i = 0; i < days.length; i++) {
                for (let j = 0; j < hours.length; j++) {
                    data.push([j, i, 0]);
                }
            }

            // 填充实际数据
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

            // 计算最大值，用于视觉映射
            const maxValue = Math.max(...data.map(item => item[2]), 1);

            const option = {
                tooltip: {
                    position: 'top',
                    formatter: params => `${hours[params.data[0]]}:00, ${days[params.data[1]]}: ${params.data[2]} 个任务`
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '8%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: hours.map(h => `${h}:00`),
                    splitArea: { show: true }
                },
                yAxis: {
                    type: 'category',
                    data: days,
                    splitArea: { show: true }
                },
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
                    type: 'heatmap',
                    data: data,
                    label: { show: false },
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }]
            };

            try {
                this.heatmapChart.setOption(option, { replaceMerge: ['series'] });
            } catch (error) {
                console.error('热力图设置选项失败:', error);
                // 重新初始化图表
                this.heatmapChart.dispose();
                this.heatmapChart = echarts.init(this.$refs.heatmapChart);
                this.heatmapChart.setOption(option);
            }
        },

        /**
         * 格式化AI报告为HTML
         * @param {string} rawReport - 原始报告文本
         * @returns {string} 格式化后的HTML
         */
        formatAIReport(rawReport) {
            if (!rawReport) return '';

            // Clean the raw report text
            const cleanReport = rawReport
                .replace(/^"(.*)"$/s, '$1')
                .replace(/\\n/g, '\n')
                .trim();

            // First do a pre-processing pass to identify list regions
            let preprocessed = cleanReport;

            // Mark list regions with special tokens to process them as blocks later
            preprocessed = preprocessed.replace(/(?:^|\n+)((?:[ \t]*(?:[-*]|\d+\.)[ \t]+.+\n?)+)/g, (match, listBlock) => {
                return '\n\n__LIST_START__\n' + listBlock + '\n__LIST_END__\n\n';
            });

            // Define regex patterns and their HTML replacements
            const markdownPatterns = [
                // Headers
                { pattern: /^###### (.+?)(?=\n|$)/gm, replacement: '<h6 class="text-sm font-medium mt-4 mb-2 text-blue-400">$1</h6>' },
                { pattern: /^##### (.+?)(?=\n|$)/gm, replacement: '<h5 class="text-sm font-medium mt-4 mb-2 text-blue-400">$1</h5>' },
                { pattern: /^#### (.+?)(?=\n|$)/gm, replacement: '<h4 class="text-base font-medium mt-4 mb-2 text-blue-500">$1</h4>' },
                { pattern: /^### (.+?)(?=\n|$)/gm, replacement: '<h3 class="text-lg font-semibold mt-5 mb-3 text-blue-600">$1</h3>' },
                { pattern: /^## (.+?)(?=\n|$)/gm, replacement: '<h2 class="text-xl font-bold mt-6 mb-4 text-blue-700">$1</h2>' },
                { pattern: /^# (.+?)(?=\n|$)/gm, replacement: '<h1 class="text-2xl font-bold mt-8 mb-6 text-blue-800">$1</h1>' },

                // Code blocks
                { pattern: /```([^`]+)```/g, replacement: '<pre class="bg-gray-100 p-3 rounded overflow-x-auto my-4 text-sm font-mono">$1</pre>' },

                // Formatting
                { pattern: /\*\*(.*?)\*\*/g, replacement: '<strong class="font-bold">$1</strong>' },
                { pattern: /\*(.*?)\*/g, replacement: '<em class="italic">$1</em>' },
                { pattern: /`([^`]+)`/g, replacement: '<code class="bg-gray-100 px-1 rounded text-red-600 font-mono">$1</code>' },

                // Horizontal rule
                { pattern: /^-{3,}$/gm, replacement: '<hr class="my-6 border-t-2 border-blue-100">' },

                // Links
                { pattern: /\[(.*?)\]\((.*?)\)/g, replacement: '<a href="$2" class="text-blue-600 hover:underline">$1</a>' },

                // Images
                {
                    pattern: /!\[(.*?)\]\((.*?)\)/g, replacement: (match, alt, src) =>
                        `<figure class="my-6">
                <img src="${src}" alt="${alt || '图表'}" class="mx-auto max-w-full h-auto rounded-lg border shadow-md" loading="lazy">
                ${alt ? `<figcaption class="mt-2 text-center text-sm text-gray-600">${alt}</figcaption>` : ''}
            </figure>`
                },

                // Footnotes
                { pattern: /\[\^(\d+)\]:\s*(.*)/g, replacement: '<div class="text-sm text-gray-500 mt-2 border-t pt-1">[$1]: $2</div>' },

                // Tables
                {
                    pattern: /(\|.+\|)\n(\|[-: ]+\|)+\n((?:\|.*\|\n?)+)/g, replacement: (match, header, divider, body) => {
                        const alignments = divider.split('|').slice(1, -1).map(col => {
                            if (col.trim().startsWith(':') && col.trim().endsWith(':')) return 'text-center';
                            if (col.trim().endsWith(':')) return 'text-right';
                            return 'text-left';
                        });

                        const headerCells = header.split('|').slice(1, -1).map((cell, i) =>
                            `<th class="p-2 border bg-blue-50 font-semibold ${alignments[i]}">${cell.trim()}</th>`
                        ).join('');

                        const bodyRows = body.split('\n')
                            .filter(row => row.trim() && row.includes('|'))
                            .map((row, rowIndex) => {
                                const cells = row.split('|').slice(1, -1).map((cell, i) =>
                                    `<td class="p-2 border ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${alignments[i]}">${cell.trim()}</td>`
                                ).join('');
                                return `<tr>${cells}</tr>`;
                            }).join('');

                        return `<div class="overflow-x-auto my-6">
                <table class="w-full border-collapse">
                    <thead><tr>${headerCells}</tr></thead>
                    <tbody>${bodyRows}</tbody>
                </table>
            </div>`;
                    }
                },

                // Emojis
                { pattern: /:\)/g, replacement: '😊' },
                { pattern: /:\(/g, replacement: '😢' },
                { pattern: /:D/g, replacement: '😄' },
                { pattern: /:p/g, replacement: '😛' },
                { pattern: /:o/g, replacement: '😲' },

                // HTML entities
                { pattern: /&gt;/g, replacement: '>' },
                { pattern: /&lt;/g, replacement: '<' },
                { pattern: /&amp;/g, replacement: '&' },
            ];

            // Apply all patterns
            let formattedReport = preprocessed;
            markdownPatterns.forEach(({ pattern, replacement }) => {
                formattedReport = formattedReport.replace(pattern, replacement);
            });

            // Process lists
            formattedReport = formattedReport.replace(/__LIST_START__\n([\s\S]*?)\n__LIST_END__/g, (match, listContent) => {
                // Determine if the list is ordered or unordered
                const isOrdered = /^\s*\d+\./.test(listContent);

                // Process list items
                let processedItems = '';
                let currentLevel = 0;
                const lines = listContent.split('\n');

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    // Determine the indentation level
                    const indentMatch = lines[i].match(/^(\s*)/);
                    const indent = indentMatch ? indentMatch[1].length : 0;
                    const level = Math.floor(indent / 2);

                    // Get the item content
                    let itemContent = '';

                    if (isOrdered) {
                        const match = line.match(/^\s*(\d+)\.(.+)$/);
                        if (match) {
                            itemContent = match[2].trim();
                        } else {
                            itemContent = line;
                        }
                    } else {
                        const match = line.match(/^\s*[-*](.+)$/);
                        if (match) {
                            itemContent = match[1].trim();
                        } else {
                            itemContent = line;
                        }
                    }

                    // Create the list item
                    processedItems += `<li class="mb-2 ${level > 0 ? `ml-${Math.min(level * 4, 16)}` : ''}">${itemContent}</li>`;
                }

                // Wrap in the appropriate list type
                return `<${isOrdered ? 'ol' : 'ul'} class="my-4 pl-6 ${isOrdered ? 'list-decimal' : 'list-disc'}">${processedItems}</${isOrdered ? 'ol' : 'ul'}>`;
            });

            // Process paragraphs - must be done after lists to avoid conflicts
            formattedReport = formattedReport.replace(/(?<!\n<(?:h[1-6]|ul|ol|li|div|table|pre|hr)[\s>])((?:(?!\n<(?:h[1-6]|ul|ol|li|div|table|pre|hr)[\s>]).)+)(?:\n{2,}|$)/gs, (match, content) => {
                if (content.trim()) {
                    return `<p class="mb-4 leading-relaxed">${content.trim()}</p>`;
                }
                return '';
            });

            // Remove unnecessary whitespace and normalize line endings
            formattedReport = formattedReport
                .replace(/\n{3,}/g, '\n\n')
                .replace(/<p>\s*<\/p>/g, '')
                .replace(/\s+</g, '<')
                .replace(/>\s+/g, '>')
                .trim();

            // Wrap in final container with metadata
            return `
        <div class="ai-report p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
            <h2 class="text-2xl font-bold mb-6 text-center text-blue-800 border-b pb-4">AI数据分析报告</h2>
            ${formattedReport}
            <div class="text-right text-sm text-gray-500 mt-8 pt-4 border-t">
                生成时间: ${new Date().toLocaleString('zh-CN', { hour12: false })}
            </div>
        </div>
    `;
        },

        /**
         * 生成AI分析报告
         */
        async generateAIReport() {
            if (!this.timeRange.start || !this.timeRange.end) {
                ElMessage.warning('请选择完整的时间范围');
                return;
            }

            this.aiReport = '';
            this.aiReportLoading = true;

            try {
                // 确保有可用数据
                if (!this.analyticsData) {
                    throw new Error('没有可用的分析数据，请先获取数据');
                }

                const payload = {
                    timeRange: {
                        start: this.timeRange.start,
                        end: this.timeRange.end,
                        interval: this.timeRange.interval
                    },
                    analyticsData: this.analyticsData
                };

                // 使用fetch API处理流式请求
                const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
                const response = await fetch(`${apiUrl}/analytics/ai_report`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // 创建读取器处理流式数据
                const reader = response.body.getReader();
                const decoder = new TextDecoder('utf-8');
                let done = false;

                // 逐块读取流式数据
                while (!done) {
                    const { value, done: streamDone } = await reader.read();
                    done = streamDone;

                    if (value) {
                        const chunk = decoder.decode(value, { stream: true });
                        const lines = chunk.split('\n');

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6).trim(); // 去掉 "data: " 前缀

                                if (data === '[DONE]') {
                                    done = true; // 流结束
                                    break;
                                }

                                try {
                                    const parsedData = JSON.parse(data);
                                    if (parsedData.choices && parsedData.choices[0].delta.content) {
                                        this.aiReport += parsedData.choices[0].delta.content; // 累加内容

                                        // 滚动到底部
                                        this.$nextTick(() => {
                                            const container = this.$refs.reportContainer;
                                            if (container) {
                                                container.scrollTo({
                                                    top: container.scrollHeight,
                                                    behavior: 'smooth'
                                                });
                                            }
                                        });
                                    }
                                    this.tempReport += parsedData.choices[0].delta.content
                                } catch (error) {
                                    console.error('解析 JSON 失败:', error);
                                }
                            }
                            this.aiReportLoading = false;
                        }
                    }
                }
                this.analyticsStore.saveReport(
                    this.tempReport,
                    { ...this.timeRange }
                )

            } catch (error) {
                console.error('生成AI报告失败:', error);
                ElMessage.error(`生成AI报告失败: ${error.message}`);
                this.aiReportLoading = false;
                this.tempReport = ''
                // 降级到本地生成报告
                setTimeout(() => {
                    this.aiReport = this.generateLocalAIReport();
                }, 500);
            }
        },


        // 添加一个新方法来生成本地AI报告
        generateLocalAIReport(rawReport) {
            // 基于当前已有的analyticsData数据生成一个简单的报告
            const data = this.analyticsData;
            let reportContent = `
            < h3 > 数据分析报告</ >
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

                categoryText += `${maxCategory.name}类任务占比最高，达到${maxCategory.value} %。`;

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

                heatmapText += `用户活跃高峰集中在${maxTimeSlot.time}前后。建议在这段时间安排重要任务以提高效率。</p > `;
                reportContent += heatmapText;
            }

            // 添加总结建议
            reportContent += `
            < h4 > 建议:</ >
            <ul>
                <li>合理安排任务时间，充分利用高效工作时段</li>
                <li>平衡不同类型的任务，避免单一类型任务过多</li>
                <li>定期分析任务完成情况，持续优化时间管理策略</li>
            </ul>
        `;

            // return reportContent;
            return this._originalFormatMethod(this.tempReport || rawReport)
        },

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

/* 加载动画 */
.dot-flashing {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 5px;
    background-color: #409eff;
    animation: dotFlashing 1s infinite linear;
    margin-right: 8px;
}

@keyframes dotFlashing {
    0% {
        opacity: 0.2;
        transform: translateY(0);
    }

    50% {
        opacity: 1;
        transform: translateY(-3px);
    }

    100% {
        opacity: 0.2;
        transform: translateY(0);
    }
}

/* 保证内容容器可滚动 */
.streaming-output {
    max-height: 60vh;
    overflow-y: auto;
    padding: 12px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
}

/* 加载提示 */
.streaming-indicator {
    display: flex;
    align-items: center;
    color: #909399;
    margin-top: 8px;
}

/* 确保内容容器可滚动 */
.ai-report-content {
    max-height: 60vh;
    /* 根据需求调整高度 */
    overflow-y: auto;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 4px;
}

/* 防止内容溢出 */
.ai-report-rendered {
    word-break: break-word;
}

/* 确保按钮区域间距 */
.ai-analysis-section {
    padding: 18px 20px;
}
</style>