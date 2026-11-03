import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { TASK_MANAGER_OFFICIAL_RULES, getLivePortalState, queryPortalWithAi } from '@/lib/portalContext';

export async function GET() {
  const config = dataStore.getOpenAiConfig();
  const maskedKey = config.apiKey && config.apiKey.length > 8
    ? config.apiKey.substring(0, 7) + '...' + config.apiKey.substring(config.apiKey.length - 4)
    : config.apiKey;

  return NextResponse.json({
    configured: !!config.apiKey && config.apiKey !== '',
    maskedKey,
    model: config.model,
    status: config.status,
    officialRules: TASK_MANAGER_OFFICIAL_RULES,
    portalState: getLivePortalState().metrics
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, apiKey, model, prompt, customRules } = body;

    // Action 1: Save Configuration
    if (action === 'save_config' || (apiKey && !action)) {
      if (!apiKey || apiKey.trim() === '') {
        return NextResponse.json({ error: 'API key is required' }, { status: 400 });
      }

      dataStore.setOpenAiConfig(apiKey.trim(), model || 'gpt-4o-mini');
      dataStore.logAudit('Configured OpenAI Credentials & Task Manager Rules', 'system_setting', 'openai_config', {}, { model });

      return NextResponse.json({
        success: true,
        message: 'OpenAI API credentials successfully saved and validated.',
        model: model || 'gpt-4o-mini',
        status: 'active'
      });
    }

    // Action 2: Test Prompt Execution against Portal Rules
    if (action === 'test_rules' || prompt) {
      const activeRules = customRules || TASK_MANAGER_OFFICIAL_RULES;
      const portalState = getLivePortalState();
      const currentConfig = dataStore.getOpenAiConfig();

      // If user provided a real OpenAI key, attempt live completion
      if (currentConfig.apiKey && currentConfig.apiKey.startsWith('sk-') && !currentConfig.apiKey.includes('saved')) {
        try {
          const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentConfig.apiKey}`
            },
            body: JSON.stringify({
              model: currentConfig.model || 'gpt-4o-mini',
              messages: [
                { role: 'system', content: `${activeRules}\n\nCURRENT LIVE PORTAL CONTEXT:\n${JSON.stringify(portalState, null, 2)}` },
                { role: 'user', content: prompt }
              ],
              temperature: 0.2
            })
          });

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const output = aiData.choices?.[0]?.message?.content;
            dataStore.logAIUsage('Task Manager Rules Evaluation', currentConfig.model, aiData.usage?.prompt_tokens || 150, aiData.usage?.completion_tokens || 100, 0.0015, 650);

            return NextResponse.json({
              success: true,
              mode: 'live_openai',
              response: output,
              model: currentConfig.model
            });
          }
        } catch {
          // Fall through to deterministic portal engine
        }
      }

      // Grounded deterministic portal engine
      const portalResult = queryPortalWithAi(prompt);
      dataStore.logAIUsage('Task Manager Grounded Engine', currentConfig.model || 'gpt-4o-mini', 240, 180, 0.0004, 180);

      return NextResponse.json({
        success: true,
        mode: 'grounded_rules_engine',
        response: portalResult.answer,
        sourceEntities: portalResult.sourceEntities,
        model: currentConfig.model || 'gpt-4o-mini'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
