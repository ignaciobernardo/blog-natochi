import { eq, isNotNull } from 'drizzle-orm';
import VotingResultsEmail from '@/src/emails/projects/voting-results';
import { db } from '@/src/lib/db';
import { hackerProfiles, hackers, projects, teams } from '@/src/lib/db/schema';
import { sendEmail } from '@/src/lib/email';
import { getDefaultEvent } from '@/src/queries/events';

interface ProjectWithMembers {
  projectId: string;
  projectName: string;
  projectSlug: string;
  teamId: string;
  teamSlug: string;
  members: Array<{
    hackerId: string;
    fullName: string;
    email: string;
  }>;
}

export class VotingResultsSender {
  async sendToAllTeamMembers(): Promise<void> {
    try {
      const event = await getDefaultEvent();
      if (!event) {
        throw new Error('No default event found');
      }

      const projectsWithMembers = await this.getProjectsWithMembers();

      if (projectsWithMembers.length === 0) {
        console.log('No projects with video start time found');
        return;
      }

      console.log(
        `Found ${projectsWithMembers.length} projects to send voting results emails for`,
      );

      let totalEmailsSent = 0;

      const isProduction = process.env.NODE_ENV === 'production';
      const baseUrl = isProduction
        ? event.domain
        : process.env.NEXT_PUBLIC_APP_URL || 'https://hack.platan.us';

      console.log(`Using base URL: ${baseUrl}`);

      for (const project of projectsWithMembers) {
        const emailPromises = project.members.map(async (member) => {
          const subject = '🏆 Resultados votación pública';

          console.log(
            `📧 Sending voting results email to ${member.fullName} (${member.email})`,
          );

          await sendEmail({
            templateName: 'voting-results',
            template: VotingResultsEmail,
            templateProps: {
              hackerName: member.fullName,
              baseUrl,
            },
            to: member.email,
            subject,
            sentByUserId: null,
          });

          console.log(
            `✅ Queued voting results email for ${member.fullName} (${member.email}) - Project: ${project.projectName}`,
          );
        });

        await Promise.all(emailPromises);
        totalEmailsSent += project.members.length;
      }

      console.log(
        `\n🎉 Successfully queued ${totalEmailsSent} voting results emails for ${projectsWithMembers.length} projects`,
      );
    } catch (error) {
      console.error('Failed to send voting results emails:', error);
      throw error;
    }
  }

  private async getProjectsWithMembers(): Promise<ProjectWithMembers[]> {
    const projectsWithStartTime = await db
      .select({
        projectId: projects.id,
        projectName: projects.name,
        projectSlug: projects.slug,
        teamId: projects.teamId,
        teamSlug: teams.slug,
      })
      .from(projects)
      .innerJoin(teams, eq(projects.teamId, teams.id))
      .where(isNotNull(projects.videoStartAt));

    const projectsWithMembersData: ProjectWithMembers[] = [];

    for (const project of projectsWithStartTime) {
      const members = await db
        .select({
          hackerId: hackers.id,
          fullName: hackers.fullName,
          email: hackers.email,
        })
        .from(hackerProfiles)
        .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
        .where(eq(hackerProfiles.teamId, project.teamId));

      if (members.length > 0) {
        projectsWithMembersData.push({
          projectId: project.projectId,
          projectName: project.projectName,
          projectSlug: project.projectSlug,
          teamId: project.teamId,
          teamSlug: project.teamSlug,
          members,
        });
      }
    }

    return projectsWithMembersData;
  }
}

export const votingResultsSender = new VotingResultsSender();
