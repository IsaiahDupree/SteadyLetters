'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/server-auth';

export async function createOrganization(data: {
  name: string;
  slug: string;
}) {
  try {
    const user = await getCurrentUser();

    // Check if slug already exists
    const existing = await prisma.organization.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new Error('Organization slug already exists');
    }

    const organization = await prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        members: {
          create: {
            userId: user.id,
            role: 'owner',
          },
        },
      },
      include: {
        members: true,
      },
    });

    revalidatePath('/organizations');
    return { success: true, id: organization.id };
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
}

export async function getOrganizations() {
  try {
    const user = await getCurrentUser();

    const organizations = await prisma.organizationMember.findMany({
      where: { userId: user.id },
      include: {
        organization: {
          include: {
            members: true,
          },
        },
      },
    });

    return organizations.map((om) => om.organization);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    throw error;
  }
}

export async function getOrganization(slug: string) {
  try {
    const user = await getCurrentUser();

    const organization = await prisma.organization.findUnique({
      where: { slug },
      include: {
        members: true,
        recipients: true,
        templates: true,
      },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Verify user is a member
    const isMember = organization.members.some((m) => m.userId === user.id);
    if (!isMember) {
      throw new Error('Access denied');
    }

    return organization;
  } catch (error) {
    console.error('Error fetching organization:', error);
    throw error;
  }
}

export async function inviteOrganizationMember(
  organizationSlug: string,
  email: string,
  role: string = 'member'
) {
  try {
    const user = await getCurrentUser();

    const organization = await prisma.organization.findUnique({
      where: { slug: organizationSlug },
      include: { members: true },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Check if user has permission (must be owner or admin)
    const userMembership = organization.members.find((m) => m.userId === user.id);
    if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
      throw new Error('Access denied');
    }

    // Find or create the invited user
    let invitedUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!invitedUser) {
      invitedUser = await prisma.user.create({
        data: { email },
      });
    }

    // Check if already a member
    const existing = organization.members.find((m) => m.userId === invitedUser!.id);
    if (existing) {
      throw new Error('User is already a member');
    }

    // Add member
    await prisma.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: invitedUser.id,
        role,
      },
    });

    revalidatePath(`/organizations/${organizationSlug}`);
    return { success: true };
  } catch (error) {
    console.error('Error inviting member:', error);
    throw error;
  }
}

export async function removeOrganizationMember(
  organizationSlug: string,
  memberId: string
) {
  try {
    const user = await getCurrentUser();

    const organization = await prisma.organization.findUnique({
      where: { slug: organizationSlug },
      include: { members: true },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Check if user has permission
    const userMembership = organization.members.find((m) => m.userId === user.id);
    if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
      throw new Error('Access denied');
    }

    // Prevent removing the last owner
    const memberToRemove = organization.members.find((m) => m.id === memberId);
    if (memberToRemove?.role === 'owner') {
      const ownerCount = organization.members.filter((m) => m.role === 'owner').length;
      if (ownerCount === 1) {
        throw new Error('Cannot remove the last owner');
      }
    }

    await prisma.organizationMember.delete({
      where: { id: memberId },
    });

    revalidatePath(`/organizations/${organizationSlug}`);
    return { success: true };
  } catch (error) {
    console.error('Error removing member:', error);
    throw error;
  }
}

export async function updateOrganizationMemberRole(
  organizationSlug: string,
  memberId: string,
  newRole: string
) {
  try {
    const user = await getCurrentUser();

    const organization = await prisma.organization.findUnique({
      where: { slug: organizationSlug },
      include: { members: true },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Check if user has permission
    const userMembership = organization.members.find((m) => m.userId === user.id);
    if (!userMembership || userMembership.role !== 'owner') {
      throw new Error('Access denied - only owners can change roles');
    }

    await prisma.organizationMember.update({
      where: { id: memberId },
      data: { role: newRole },
    });

    revalidatePath(`/organizations/${organizationSlug}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating member role:', error);
    throw error;
  }
}

export async function updateOrganization(
  slug: string,
  data: {
    name?: string;
    logo?: string;
  }
) {
  try {
    const user = await getCurrentUser();

    const organization = await prisma.organization.findUnique({
      where: { slug },
      include: { members: true },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Check if user is owner
    const userMembership = organization.members.find((m) => m.userId === user.id);
    if (!userMembership || userMembership.role !== 'owner') {
      throw new Error('Access denied');
    }

    await prisma.organization.update({
      where: { slug },
      data,
    });

    revalidatePath(`/organizations/${slug}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating organization:', error);
    throw error;
  }
}
