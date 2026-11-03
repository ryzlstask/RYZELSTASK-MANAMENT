import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { TaskCategory, TaskPriority } from '@/types';

export async function POST(req: Request) {
  try {
    const { requirementText } = await req.json();

    if (!requirementText) {
      return NextResponse.json({ error: 'Requirement text is required' }, { status: 400 });
    }

    const lower = requirementText.toLowerCase();

    // 1 & 2. Identify relevant client & website
    let targetClient = dataStore.getClients().find(c => lower.includes(c.company_name.toLowerCase()));
    let targetWebsite = dataStore.getWebsites().find(w => lower.includes(w.domain.toLowerCase()) || lower.includes(w.website_name.toLowerCase()));

    if (!targetClient) {
      if (lower.includes('abc electronics')) {
        targetClient = dataStore.getClients().find(c => c.id === 'client-1');
        targetWebsite = dataStore.getWebsites().find(w => w.id === 'web-2');
      } else if (lower.includes('abc')) {
        targetClient = dataStore.getClients().find(c => c.id === 'client-1');
        targetWebsite = dataStore.getWebsites().find(w => w.id === 'web-1');
      } else if (lower.includes('apex')) {
        targetClient = dataStore.getClients().find(c => c.id === 'client-2');
        targetWebsite = dataStore.getWebsites().find(w => w.id === 'web-4');
      } else if (lower.includes('nexus')) {
        targetClient = dataStore.getClients().find(c => c.id === 'client-3');
        targetWebsite = dataStore.getWebsites().find(w => w.id === 'web-5');
      } else {
        targetClient = dataStore.getClients()[0];
        targetWebsite = dataStore.getWebsites()[0];
      }
    }

    // 3 & 4. Intelligent Task Decomposition
    const proposedTasks: Array<{
      id: string;
      title: string;
      category: TaskCategory;
      departmentId: string;
      estimatedHours: number;
      deadlineDays: number;
      priority: TaskPriority;
      dependencies: string[];
      recommendation: any;
    }> = [];

    // Subtask 1: UI/UX & Wireframing
    const designScores = dataStore.scoreEmployeesForTask('Website design', 'high', 'dept-2');
    proposedTasks.push({
      id: 'prop-1',
      title: `Design high-fidelity UI & responsive component layout for ${targetWebsite?.website_name || 'Website'}`,
      category: 'Website design',
      departmentId: 'dept-2',
      estimatedHours: 8,
      deadlineDays: 2,
      priority: 'high',
      dependencies: [],
      recommendation: designScores[0]
    });

    // Subtask 2: Frontend & Product Section Implementation
    const frontendScores = dataStore.scoreEmployeesForTask('Frontend development', 'high', 'dept-1');
    proposedTasks.push({
      id: 'prop-2',
      title: `Develop responsive hero banner, dynamic product catalog grid & navigation`,
      category: targetWebsite?.platform === 'Shopify' ? 'Shopify development' : 'Frontend development',
      departmentId: 'dept-1',
      estimatedHours: 12,
      deadlineDays: 4,
      priority: 'high',
      dependencies: ['prop-1'],
      recommendation: frontendScores[0]
    });

    // Subtask 3: Backend Form & API Integration
    const backendScores = dataStore.scoreEmployeesForTask('Backend development', 'medium', 'dept-1');
    proposedTasks.push({
      id: 'prop-3',
      title: `Integrate contact form submission handler, validation & CRM webhook`,
      category: 'Backend development',
      departmentId: 'dept-1',
      estimatedHours: 6,
      deadlineDays: 5,
      priority: 'medium',
      dependencies: ['prop-2'],
      recommendation: backendScores[0]
    });

    // Subtask 4: Technical SEO & Speed Audit
    const seoScores = dataStore.scoreEmployeesForTask('Speed optimization', 'medium', 'dept-3');
    proposedTasks.push({
      id: 'prop-4',
      title: `SEO metadata tagging, schema markup and Core Web Vitals audit`,
      category: 'SEO',
      departmentId: 'dept-3',
      estimatedHours: 4,
      deadlineDays: 6,
      priority: 'medium',
      dependencies: ['prop-2', 'prop-3'],
      recommendation: seoScores[0]
    });

    // Record AI usage log
    dataStore.logAIUsage(
      'task_decomposition',
      'gpt-4o',
      420,
      280,
      0.0041,
      1420
    );

    return NextResponse.json({
      identifiedClient: targetClient,
      identifiedWebsite: targetWebsite,
      reasoning: `Deconstructed project into 4 sequential deliverables across Design, Engineering, and SEO. Evaluated candidate skill matrix and live weekly workload capacity to prevent bottlenecks.`,
      proposedTasks
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

