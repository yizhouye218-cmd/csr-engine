export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { gameName, gameTheme, extraContext } = req.body;

  if (!gameName || !gameTheme) {
    return res.status(400).json({ error: '请填写游戏名称和IP核心主题' });
  }

  const systemPrompt = `你是一个专注于游戏公司企业社会责任（CSR）领域的创意策划专家。
你的任务是：根据用户提供的游戏IP信息，结合你对当前真实公益领域的了解，生成3个有深度、可落地的CSR跨界项目策划灵感方案。

每个方案必须包含：
1. title：方案标题（10字以内，有创意）
2. subtitle：一句话描述（20字以内）
3. charity_background：真实的公益项目或社会议题背景（100-150字）
4. ip_connection：游戏IP与该公益议题的情感/主题共鸣点及可借用的IP资产，100-150字
5. execution：至少2种具体可落地的合作形式，包括线上线下联动方式，100-150字
6. tags：3-5个关键词标签数组

要求：
- 方案要有差异化，分别覆盖不同公益领域
- 必须基于真实公益需求，不要空泛
- IP结合要自然有共鸣，不要生硬贴牌
- 输出严格为JSON格式，不要有任何其他文字、代码块标记

输出格式：
{"proposals":[{方案1},{方案2},{方案3}]}`;

  const userPrompt = `游戏名称：${gameName}
IP核心主题：${gameTheme}
${extraContext ? `补充说明：${extraContext}` : ''}

请为这个游戏IP生成3个CSR跨界创意策划方案。`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'API 调用失败' });
    }

    const data = await response.json();
    const rawText = data.content.map(b => b.type === 'text' ? b.text : '').join('');

    // 提取 JSON
    const match = rawText.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : rawText);

    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: '服务器错误：' + err.message });
  }
}
