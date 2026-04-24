import { eq, isNotNull } from 'drizzle-orm';
import VotingAnnouncementEmail from '@/src/emails/projects/voting-announcement';
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

export class VotingAnnouncementSender {
  async sendToAllTeamMembers(): Promise<void> {
    try {
      // Get event for domain
      const event = await getDefaultEvent();
      if (!event) {
        throw new Error('No default event found');
      }

      // Query all projects that have videoStartAt set
      const projectsWithMembers = await this.getProjectsWithMembers();

      if (projectsWithMembers.length === 0) {
        console.log('No projects with video start time found');
        return;
      }

      console.log(
        `Found ${projectsWithMembers.length} projects to send voting announcements for`,
      );

      let totalEmailsSent = 0;

      // Determine base URL: use event domain in production, otherwise fallback
      const isProduction = process.env.NODE_ENV === 'production';
      const baseUrl = isProduction
        ? event.domain
        : process.env.NEXT_PUBLIC_APP_URL || 'https://hack.platan.us';

      console.log(`Using base URL: ${baseUrl}`);

      // Send emails for each project
      for (const project of projectsWithMembers) {
        const emailPromises = project.members.map(async (member) => {
          const projectImageUrl = `${baseUrl}/assets/images/hack-25/projects-og/${project.teamSlug}.jpg`;
          const subject = `Votación pública inicia el lunes | ${project.projectName}`;

          console.log(
            `📧 Sending email with baseUrl: ${baseUrl}, projectSlug: ${project.projectSlug}`,
          );

          await sendEmail({
            templateName: 'voting-announcement',
            template: VotingAnnouncementEmail,
            templateProps: {
              hackerName: member.fullName,
              projectName: project.projectName,
              projectSlug: project.projectSlug,
              projectImageUrl,
              baseUrl,
            },
            to: member.email,
            subject,
            sentByUserId: null,
          });

          console.log(
            `✅ Queued voting announcement for ${member.fullName} (${member.email}) - Project: ${project.projectName}`,
          );
        });

        await Promise.all(emailPromises);
        totalEmailsSent += project.members.length;
      }

      console.log(
        `\n🎉 Successfully queued ${totalEmailsSent} voting announcement emails for ${projectsWithMembers.length} projects`,
      );
    } catch (error) {
      console.error('Failed to send voting announcement emails:', error);
      throw error;
    }
  }

  private async getProjectsWithMembers(): Promise<ProjectWithMembers[]> {
    // Get all projects with videoStartAt set
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

    // For each project, get team members
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

export const votingAnnouncementSender = new VotingAnnouncementSender();
