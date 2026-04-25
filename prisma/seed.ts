import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean up existing data
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.checklist.deleteMany();
  await prisma.taskTag.deleteMany();
  await prisma.task.deleteMany();
  await prisma.status.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.list.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.space.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleaned up existing data.");

  // Create demo user
  const hashedPassword = await bcrypt.hash("password123", 10);
  const user = await prisma.user.create({
    data: {
      name: "Demo User",
      email: "demo@clickup.com",
      hashedPassword,
    },
  });
  console.log(`Created user: ${user.email}`);

  // Create workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: "My Workspace",
      description: "A demo workspace for the ClickUp clone",
      color: "#7C3AED",
    },
  });

  // Add user as workspace owner
  await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      role: "owner",
    },
  });
  console.log(`Created workspace: ${workspace.name}`);

  // Create tags
  const tags = await Promise.all([
    prisma.tag.create({
      data: { name: "bug", color: "#EF4444", workspaceId: workspace.id },
    }),
    prisma.tag.create({
      data: { name: "feature", color: "#3B82F6", workspaceId: workspace.id },
    }),
    prisma.tag.create({
      data: { name: "improvement", color: "#10B981", workspaceId: workspace.id },
    }),
    prisma.tag.create({
      data: { name: "documentation", color: "#F59E0B", workspaceId: workspace.id },
    }),
    prisma.tag.create({
      data: { name: "design", color: "#EC4899", workspaceId: workspace.id },
    }),
  ]);
  console.log(`Created ${tags.length} tags`);

  // ─── Engineering Space ──────────────────────────────────────────────

  const engineeringSpace = await prisma.space.create({
    data: {
      name: "Engineering",
      description: "Engineering team space",
      color: "#3B82F6",
      icon: "code",
      order: 0,
      workspaceId: workspace.id,
    },
  });

  // Frontend folder
  const frontendFolder = await prisma.folder.create({
    data: {
      name: "Frontend",
      color: "#8B5CF6",
      order: 0,
      spaceId: engineeringSpace.id,
    },
  });

  // Backend folder
  const backendFolder = await prisma.folder.create({
    data: {
      name: "Backend",
      color: "#06B6D4",
      order: 1,
      spaceId: engineeringSpace.id,
    },
  });

  // Helper to create default statuses
  async function createDefaultStatuses(listId: string) {
    const statuses = [
      { name: "To Do", color: "#D2D5DA", type: "todo", order: 0 },
      { name: "In Progress", color: "#FFA500", type: "in_progress", order: 1 },
      { name: "Review", color: "#A855F7", type: "review", order: 2 },
      { name: "Done", color: "#16A34A", type: "done", order: 3 },
      { name: "Closed", color: "#6B7280", type: "closed", order: 4 },
    ];
    return Promise.all(
      statuses.map((s) =>
        prisma.status.create({ data: { ...s, listId } })
      )
    );
  }

  // Frontend lists
  const uiComponentsList = await prisma.list.create({
    data: {
      name: "UI Components",
      order: 0,
      spaceId: engineeringSpace.id,
      folderId: frontendFolder.id,
    },
  });
  const uiStatuses = await createDefaultStatuses(uiComponentsList.id);

  const featuresList = await prisma.list.create({
    data: {
      name: "Feature Development",
      order: 1,
      spaceId: engineeringSpace.id,
      folderId: frontendFolder.id,
    },
  });
  const featureStatuses = await createDefaultStatuses(featuresList.id);

  // Backend lists
  const apiList = await prisma.list.create({
    data: {
      name: "API Endpoints",
      order: 0,
      spaceId: engineeringSpace.id,
      folderId: backendFolder.id,
    },
  });
  const apiStatuses = await createDefaultStatuses(apiList.id);

  const dbList = await prisma.list.create({
    data: {
      name: "Database & Models",
      order: 1,
      spaceId: engineeringSpace.id,
      folderId: backendFolder.id,
    },
  });
  const dbStatuses = await createDefaultStatuses(dbList.id);

  // ─── Marketing Space ───────────────────────────────────────────────

  const marketingSpace = await prisma.space.create({
    data: {
      name: "Marketing",
      description: "Marketing team space",
      color: "#EC4899",
      icon: "globe",
      order: 1,
      workspaceId: workspace.id,
    },
  });

  const contentList = await prisma.list.create({
    data: {
      name: "Content Calendar",
      order: 0,
      spaceId: marketingSpace.id,
    },
  });
  const contentStatuses = await createDefaultStatuses(contentList.id);

  const campaignList = await prisma.list.create({
    data: {
      name: "Campaign Tracking",
      order: 1,
      spaceId: marketingSpace.id,
    },
  });
  const campaignStatuses = await createDefaultStatuses(campaignList.id);

  console.log("Created spaces, folders, and lists with statuses.");

  // ─── Tasks ─────────────────────────────────────────────────────────

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  // UI Components tasks
  const task1 = await prisma.task.create({
    data: {
      title: "Design Button component variants",
      description:
        "Create primary, secondary, outline, ghost, and destructive button variants following our design system.",
      priority: "high",
      dueDate: new Date(now.getTime() + 2 * dayMs),
      position: 65536,
      listId: uiComponentsList.id,
      statusId: uiStatuses[1].id, // In Progress
      creatorId: user.id,
      assigneeId: user.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: "Build Modal/Dialog component",
      description: "Implement reusable modal dialog with animations, backdrop, and keyboard navigation.",
      priority: "normal",
      dueDate: new Date(now.getTime() + 5 * dayMs),
      position: 131072,
      listId: uiComponentsList.id,
      statusId: uiStatuses[0].id, // To Do
      creatorId: user.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: "Fix Dropdown menu z-index issues",
      description: "Dropdown menus are appearing behind other elements in certain contexts.",
      priority: "urgent",
      dueDate: new Date(now.getTime() + 1 * dayMs),
      position: 196608,
      listId: uiComponentsList.id,
      statusId: uiStatuses[1].id, // In Progress
      creatorId: user.id,
      assigneeId: user.id,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: "Create Tooltip component",
      description: "Build tooltip with configurable placement, delay, and content.",
      priority: "low",
      dueDate: new Date(now.getTime() + 10 * dayMs),
      position: 262144,
      listId: uiComponentsList.id,
      statusId: uiStatuses[3].id, // Done
      creatorId: user.id,
    },
  });

  // Feature Development tasks
  const task5 = await prisma.task.create({
    data: {
      title: "Implement drag and drop for board view",
      description:
        "Allow users to drag task cards between columns to change status. Use @hello-pangea/dnd.",
      priority: "high",
      dueDate: new Date(now.getTime() + 3 * dayMs),
      position: 65536,
      listId: featuresList.id,
      statusId: featureStatuses[2].id, // Review
      creatorId: user.id,
      assigneeId: user.id,
    },
  });

  const task6 = await prisma.task.create({
    data: {
      title: "Add real-time notifications",
      description: "Implement WebSocket-based real-time notifications for task assignments and comments.",
      priority: "normal",
      dueDate: new Date(now.getTime() + 7 * dayMs),
      position: 131072,
      listId: featuresList.id,
      statusId: featureStatuses[0].id, // To Do
      creatorId: user.id,
    },
  });

  const task7 = await prisma.task.create({
    data: {
      title: "Build search with filters",
      description: "Full-text search across tasks with priority, status, and date filters.",
      priority: "normal",
      dueDate: new Date(now.getTime() + 4 * dayMs),
      position: 196608,
      listId: featuresList.id,
      statusId: featureStatuses[1].id, // In Progress
      creatorId: user.id,
      assigneeId: user.id,
    },
  });

  // API Endpoints tasks
  const task8 = await prisma.task.create({
    data: {
      title: "Create REST API for workspace management",
      description: "CRUD endpoints for workspaces including member management.",
      priority: "high",
      dueDate: new Date(now.getTime() - 1 * dayMs), // Overdue!
      position: 65536,
      listId: apiList.id,
      statusId: apiStatuses[1].id, // In Progress
      creatorId: user.id,
      assigneeId: user.id,
    },
  });

  const task9 = await prisma.task.create({
    data: {
      title: "Implement authentication API",
      description: "JWT-based auth with NextAuth, credentials provider, and session management.",
      priority: "urgent",
      dueDate: new Date(now.getTime() - 2 * dayMs), // Overdue!
      position: 131072,
      listId: apiList.id,
      statusId: apiStatuses[3].id, // Done
      creatorId: user.id,
    },
  });

  const task10 = await prisma.task.create({
    data: {
      title: "Add rate limiting to API routes",
      description: "Prevent abuse by adding rate limiting middleware to all API routes.",
      priority: "normal",
      dueDate: new Date(now.getTime() + 14 * dayMs),
      position: 196608,
      listId: apiList.id,
      statusId: apiStatuses[0].id, // To Do
      creatorId: user.id,
    },
  });

  // Database tasks
  const task11 = await prisma.task.create({
    data: {
      title: "Set up Prisma schema",
      description: "Define all models for the application: users, workspaces, spaces, lists, tasks, etc.",
      priority: "urgent",
      position: 65536,
      listId: dbList.id,
      statusId: dbStatuses[3].id, // Done
      creatorId: user.id,
    },
  });

  const task12 = await prisma.task.create({
    data: {
      title: "Add database indexes for performance",
      description: "Analyze slow queries and add appropriate indexes.",
      priority: "low",
      dueDate: new Date(now.getTime() + 21 * dayMs),
      position: 131072,
      listId: dbList.id,
      statusId: dbStatuses[0].id, // To Do
      creatorId: user.id,
    },
  });

  // Marketing tasks
  const task13 = await prisma.task.create({
    data: {
      title: "Write blog post about launch",
      description: "Draft a blog post announcing the product launch. Include screenshots and feature highlights.",
      priority: "high",
      dueDate: new Date(now.getTime() + 6 * dayMs),
      position: 65536,
      listId: contentList.id,
      statusId: contentStatuses[0].id, // To Do
      creatorId: user.id,
    },
  });

  const task14 = await prisma.task.create({
    data: {
      title: "Create social media graphics",
      description: "Design graphics for Twitter, LinkedIn, and Product Hunt launch.",
      priority: "normal",
      dueDate: new Date(now.getTime() + 5 * dayMs),
      position: 131072,
      listId: contentList.id,
      statusId: contentStatuses[1].id, // In Progress
      creatorId: user.id,
      assigneeId: user.id,
    },
  });

  const task15 = await prisma.task.create({
    data: {
      title: "Record product demo video",
      description: "Record a 2-minute walkthrough video showing key features.",
      priority: "high",
      dueDate: new Date(now.getTime() + 8 * dayMs),
      position: 196608,
      listId: contentList.id,
      statusId: contentStatuses[0].id, // To Do
      creatorId: user.id,
    },
  });

  const task16 = await prisma.task.create({
    data: {
      title: "Plan Product Hunt launch",
      description: "Prepare all assets, description, and maker comment for Product Hunt.",
      priority: "urgent",
      dueDate: new Date(now.getTime() + 3 * dayMs),
      position: 65536,
      listId: campaignList.id,
      statusId: campaignStatuses[1].id, // In Progress
      creatorId: user.id,
      assigneeId: user.id,
    },
  });

  const task17 = await prisma.task.create({
    data: {
      title: "Set up email newsletter",
      description: "Configure email newsletter tool and design welcome email template.",
      priority: "normal",
      dueDate: new Date(now.getTime() + 12 * dayMs),
      position: 131072,
      listId: campaignList.id,
      statusId: campaignStatuses[0].id, // To Do
      creatorId: user.id,
    },
  });

  const task18 = await prisma.task.create({
    data: {
      title: "Prepare press kit",
      description: "Create a press kit with logos, screenshots, and company information.",
      priority: "low",
      dueDate: new Date(now.getTime() + 15 * dayMs),
      position: 196608,
      listId: campaignList.id,
      statusId: campaignStatuses[0].id, // To Do
      creatorId: user.id,
    },
  });

  console.log("Created 18 tasks.");

  // ─── Subtasks ──────────────────────────────────────────────────────

  await prisma.task.create({
    data: {
      title: "Primary button style",
      priority: "normal",
      position: 65536,
      listId: uiComponentsList.id,
      statusId: uiStatuses[3].id, // Done
      creatorId: user.id,
      parentId: task1.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Secondary button style",
      priority: "normal",
      position: 131072,
      listId: uiComponentsList.id,
      statusId: uiStatuses[1].id, // In Progress
      creatorId: user.id,
      parentId: task1.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Ghost button style",
      priority: "low",
      position: 196608,
      listId: uiComponentsList.id,
      statusId: uiStatuses[0].id, // To Do
      creatorId: user.id,
      parentId: task1.id,
    },
  });

  console.log("Created 3 subtasks.");

  // ─── Comments ──────────────────────────────────────────────────────

  await prisma.comment.create({
    data: {
      content: "Started working on this. The primary variant is looking great with the new color palette!",
      taskId: task1.id,
      userId: user.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "Found the z-index issue - it's caused by a containing element with overflow:hidden. Working on a fix.",
      taskId: task3.id,
      userId: user.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "The drag and drop is working smoothly now. Ready for review!",
      taskId: task5.id,
      userId: user.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "Auth API is complete and tested. Moving to done.",
      taskId: task9.id,
      userId: user.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "Let's make sure we include pricing page screenshots in the blog post.",
      taskId: task13.id,
      userId: user.id,
    },
  });

  console.log("Created 5 comments.");

  // ─── Activities ────────────────────────────────────────────────────

  const activityData = [
    {
      action: "created",
      taskId: task1.id,
      userId: user.id,
      createdAt: new Date(now.getTime() - 5 * dayMs),
    },
    {
      action: "updated",
      field: "status",
      oldValue: "To Do",
      newValue: "In Progress",
      taskId: task1.id,
      userId: user.id,
      createdAt: new Date(now.getTime() - 3 * dayMs),
    },
    {
      action: "created",
      taskId: task3.id,
      userId: user.id,
      createdAt: new Date(now.getTime() - 2 * dayMs),
    },
    {
      action: "updated",
      field: "priority",
      oldValue: "high",
      newValue: "urgent",
      taskId: task3.id,
      userId: user.id,
      createdAt: new Date(now.getTime() - 1 * dayMs),
    },
    {
      action: "created",
      taskId: task5.id,
      userId: user.id,
      createdAt: new Date(now.getTime() - 4 * dayMs),
    },
    {
      action: "updated",
      field: "status",
      oldValue: "In Progress",
      newValue: "Review",
      taskId: task5.id,
      userId: user.id,
      createdAt: new Date(now.getTime() - 0.5 * dayMs),
    },
    {
      action: "created",
      taskId: task8.id,
      userId: user.id,
      createdAt: new Date(now.getTime() - 6 * dayMs),
    },
    {
      action: "updated",
      field: "assignee",
      newValue: "Demo User",
      taskId: task8.id,
      userId: user.id,
      createdAt: new Date(now.getTime() - 5 * dayMs),
    },
    {
      action: "updated",
      field: "status",
      oldValue: "In Progress",
      newValue: "Done",
      taskId: task9.id,
      userId: user.id,
      createdAt: new Date(now.getTime() - 1 * dayMs),
    },
    {
      action: "created",
      taskId: task16.id,
      userId: user.id,
      createdAt: new Date(now.getTime() - 2 * dayMs),
    },
  ];

  for (const activity of activityData) {
    await prisma.activity.create({ data: activity });
  }

  console.log(`Created ${activityData.length} activities.`);

  // ─── Notifications ─────────────────────────────────────────────────

  await prisma.notification.create({
    data: {
      type: "task_assigned",
      message: 'You were assigned to "Design Button component variants"',
      link: `/task/${task1.id}`,
      userId: user.id,
    },
  });

  await prisma.notification.create({
    data: {
      type: "due_soon",
      message: '"Fix Dropdown menu z-index issues" is due tomorrow',
      link: `/task/${task3.id}`,
      userId: user.id,
    },
  });

  await prisma.notification.create({
    data: {
      type: "comment_added",
      message: 'New comment on "Implement drag and drop for board view"',
      link: `/task/${task5.id}`,
      userId: user.id,
    },
  });

  await prisma.notification.create({
    data: {
      type: "status_changed",
      message: '"Implement authentication API" was marked as Done',
      link: `/task/${task9.id}`,
      read: true,
      userId: user.id,
    },
  });

  await prisma.notification.create({
    data: {
      type: "task_assigned",
      message: 'You were assigned to "Plan Product Hunt launch"',
      link: `/task/${task16.id}`,
      userId: user.id,
    },
  });

  console.log("Created 5 notifications.");

  console.log("\nSeed complete!");
  console.log("Login with:");
  console.log("  Email: demo@clickup.com");
  console.log("  Password: password123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
