import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function POST(req: Request) {
  try {
    const posts = dataStore.getContentPosts();
    const today = new Date('2026-11-02T00:00:00Z'); // Baseline simulation date
    const pipelineActions: Array<{ postId: string; platform: string; stage: string; action: string }> = [];

    for (const post of posts) {
      const pubDate = new Date(`${post.publishing_date}T00:00:00Z`);
      const diffTime = pubDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // T-3 Days: Initiation
      if (diffDays === 3 && post.approval_status === 'draft') {
        post.approval_status = 'pending_production';
        pipelineActions.push({
          postId: post.id,
          platform: post.platform,
          stage: 'T-3 Initiation',
          action: `Initiated design production task for ${post.platform} post (${post.content_type}). Assigned to designer Fatima Noor.`
        });
      }
      // T-2 Days: Progress Check
      else if (diffDays === 2) {
        pipelineActions.push({
          postId: post.id,
          platform: post.platform,
          stage: 'T-2 Progress Check',
          action: `Automated progress check logged. Production is on track for ${post.publishing_date}.`
        });
      }
      // T-1 Days: Review Submission
      else if (diffDays === 1) {
        pipelineActions.push({
          postId: post.id,
          platform: post.platform,
          stage: 'T-1 Review Gate',
          action: `Final creative asset verified in review queue for Task Manager approval.`
        });
      }
      // Publish Day: Publishing Confirmation Gate
      else if (diffDays <= 0 && post.publishing_status !== 'published') {
        pipelineActions.push({
          postId: post.id,
          platform: post.platform,
          stage: 'T-0 Publishing Gate',
          action: `Awaiting publisher confirmation with live post URL before marking Published.`
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      checkedCount: posts.length,
      actions: pipelineActions
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

