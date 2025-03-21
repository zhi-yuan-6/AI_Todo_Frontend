<!-- formatAIReport(rawReport) {
    if (!rawReport) return '';

    // 清理原始报告文本（增加防XSS处理）
    let cleanReport = rawReport
        .replace(/^"(.*)"$/s, '$1')
        .replace(/\\n/g, '\n')
        .replace(/</g, '&lt;').replace(/>/g, '&gt;'); // 基本XSS防护

    // 转换处理顺序优化（从具体到通用）
    const processors = [
        // 标题处理（h1-h6）
        {
            pattern: /^(#{1,6})\s(.+)$/gm,
            replace: (match, hashes, text) => {
                const level = Math.min(hashes.length, 6);
                const classes = [
                    'text-2xl font-bold mt-6 mb-4 text-blue-800', // h1
                    'text-xl font-bold mt-5 mb-3 text-blue-700',  // h2
                    'text-lg font-semibold mt-4 mb-2 text-blue-600', // h3
                    'text-base font-medium mt-3 mb-2 text-blue-500', // h4
                    'text-sm font-medium mt-2 mb-1 text-blue-400', // h5
                    'text-sm font-medium mt-2 mb-1 text-blue-400'  // h6
                ];
                return `<h${level} class="${classes[level-1]}">${text}</h${level}>`;
            }
        },
        
        // 代码块（需在行内代码之前处理）
        {
            pattern: /```([\s\S]*?)```/g,
            replace: '<pre class="bg-gray-100 p-4 rounded-lg mb-4 overflow-x-auto"><code>$1</code></pre>'
        },
        
        // 行内代码
        {
            pattern: /`([^`]+)`/g,
            replace: '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm">$1</code>'
        },
        
        // 表格处理（增强多行支持）
        {
            pattern: /^(\|.*\|)\n(\|.*\|)\n((?:\|.*\|(?:\n|$))*)/gm,
            replace: (match, header, divider, body) => {
                const align = divider.split('|').slice(1, -1).map(col => {
                    if (/^:?-+:?$/.test(col)) return 'text-center';
                    if (/^:-+:$/.test(col)) return 'text-left';
                    return 'text-left';
                });
                
                const rows = [header, ...body.split('\n').filter(Boolean)]
                    .map(row => row.split('|').slice(1, -1).map(cell => cell.trim()));
                
                return `<div class="overflow-x-auto mb-4">
                    <table class="w-full border-collapse">
                        <thead><tr>${
                            rows[0].map((th, i) => 
                                `<th class="p-2 bg-blue-50 ${align[i] || ''} border-b-2 border-blue-200">${th}</th>`
                            ).join('')
                        }</tr></thead>
                        <tbody>${
                            rows.slice(2).map(row =>
                                `<tr>${
                                    row.map(td => 
                                        `<td class="p-2 border-b border-blue-100">${td}</td>`
                                    ).join('')
                                }</tr>`
                            ).join('')
                        }</tbody>
                    </table>
                </div>`;
            }
        },
        
        // 图片（支持自适应宽高）
        {
            pattern: /!\[(.*?)\]\((.*?)\)/g,
            replace: (match, alt, src) => `
                <figure class="my-6 text-center">
                    <img src="${src}" alt="${alt || '图表'}" 
                         class="mx-auto max-w-full h-auto rounded-lg border shadow-md"
                         loading="lazy">
                    ${alt ? `<figcaption class="mt-2 text-sm text-gray-500">${alt}</figcaption>` : ''}
                </figure>`
        },
        
        // 链接（增加安全校验）
        {
            pattern: /\[(.*?)\]\((.*?)\)/g,
            replace: (match, text, url) => {
                const safeUrl = url.startsWith('http') ? url : '#';
                return `<a href="${safeUrl}" class="text-blue-600 hover:underline" target="_blank" rel="noopener">${text}</a>`;
            }
        },
        
        // 增强型列表处理（支持多级嵌套）
        {
            pattern: /^((\s*)([-*+]|\d+\.)\s.*(\n(?:\2\s{2,}\S.*)?)*)/gm,
            replace: (match) => {
                const lines = match.split('\n');
                let html = '';
                let stack = [];
                
                lines.forEach(line => {
                    const indent = (line.match(/^(\s*)/)[0].length;
                    const isOrdered = /^\s*\d+\./.test(line);
                    const content = line.replace(/^\s*[-*+]\s|\d+\.\s/, '').trim();
                    
                    while (stack.length > 0 && stack[stack.length-1].indent >= indent) {
                        html += `</${stack.pop().type}>`;
                    }
                    
                    const listType = isOrdered ? 'ol' : 'ul';
                    if (stack.length === 0 || stack[stack.length-1].indent < indent) {
                        html += `<${listType} class="mb-2 pl-6 ${isOrdered ? 'list-decimal' : 'list-disc'}">`;
                        stack.push({ indent, type: listType });
                    }
                    
                    html += `<li class="mb-1">${content}</li>`;
                });
                
                while (stack.length > 0) {
                    html += `</${stack.pop().type}>`;
                }
                
                return html;
            }
        },
        
        // 强调文本（最后处理）
        {
            pattern: /\*\*(.*?)\*\*/g,
            replace: '<strong class="font-semibold">$1</strong>'
        },
        {
            pattern: /\*(.*?)\*/g,
            replace: '<em class="italic">$1</em>'
        },
        
        // 段落处理（最后执行）
        {
            pattern: /^([^<\n].*)(?=\n|$)/gm,
            replace: '<p class="mb-4 text-gray-700 leading-relaxed">$1</p>'
        }
    ];

    // 分步处理内容
    let formattedReport = cleanReport;
    processors.forEach(({ pattern, replace }) => {
        formattedReport = formattedReport.replace(pattern, replace);
    });

    // 最终包装
    return `
        <div class="ai-report p-6 bg-white rounded-xl shadow-lg not-prose">
            <h2 class="text-3xl font-bold mb-6 text-center text-blue-800">AI数据分析报告</h2>
            ${formattedReport.trim()}
            <div class="mt-6 pt-4 border-t border-blue-100 text-right text-sm text-gray-500">
                生成时间: ${new Date().toLocaleString()}
            </div>
        </div>
    `;
} -->