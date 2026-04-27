import type {
  Task,
  Status,
  List,
  Space,
  Folder,
  User,
  Checklist,
  ChecklistItem,
  Comment,
  Tag,
  TaskTag,
  Activity,
  Workspace,
  WorkspaceMember,
  TimeEntry,
  CustomField,
  CustomFieldValue,
  TaskDependency,
  TaskRecurrence,
  TaskAssignee,
  Favorite,
} from "@prisma/client";

// ─── Extended Task Types ────────────────────────────────────────────────────

export type TaskAssigneeWithUser = TaskAssignee & {
  user: Pick<User, "id" | "name" | "email" | "image">;
};

export type TaskWithDetails = Task & {
  status: Status;
  assignee: Pick<User, "id" | "name" | "email" | "image"> | null;
  creator: Pick<User, "id" | "name" | "email" | "image">;
  checklists: ChecklistWithItems[];
  taskTags: TaskTagWithTag[];
  comments: CommentWithUser[];
  subtasks: Task[];
  timeEntries?: TimeEntryWithDetails[];
  customFieldValues?: CustomFieldValueWithField[];
  dependencies?: TaskDependencyWithTask[];
  dependents?: TaskDependencyWithTask[];
  recurrence?: TaskRecurrence | null;
  assignees?: TaskAssigneeWithUser[];
  _count?: {
    subtasks: number;
    comments: number;
    timeEntries?: number;
    dependencies?: number;
    dependents?: number;
  };
};

export type TaskSummary = Task & {
  status: Status;
  assignee: Pick<User, "id" | "name" | "email" | "image"> | null;
  taskTags: TaskTagWithTag[];
  recurrence?: TaskRecurrence | null;
  assignees?: TaskAssigneeWithUser[];
  _count: {
    subtasks: number;
    comments: number;
  };
};

// ─── Checklist Types ────────────────────────────────────────────────────────

export type ChecklistWithItems = Checklist & {
  items: ChecklistItem[];
};

// ─── Comment Types ──────────────────────────────────────────────────────────

export type CommentWithUser = Comment & {
  user: Pick<User, "id" | "name" | "email" | "image">;
};

// ─── Tag Types ──────────────────────────────────────────────────────────────

export type TaskTagWithTag = TaskTag & {
  tag: Tag;
};

// ─── List Types ─────────────────────────────────────────────────────────────

export type ListWithStatuses = List & {
  statuses: Status[];
};

export type ListWithTasks = List & {
  statuses: Status[];
  tasks: TaskSummary[];
};

// ─── Folder Types ───────────────────────────────────────────────────────────

export type FolderWithLists = Folder & {
  lists: ListWithStatuses[];
};

// ─── Space Types ────────────────────────────────────────────────────────────

export type SpaceWithContents = Space & {
  folders: FolderWithLists[];
  lists: ListWithStatuses[]; // Lists not inside a folder
};

// ─── Workspace Types ────────────────────────────────────────────────────────

export type WorkspaceWithMembers = Workspace & {
  members: (WorkspaceMember & {
    user: Pick<User, "id" | "name" | "email" | "image">;
  })[];
};

export type WorkspaceWithSpaces = Workspace & {
  spaces: SpaceWithContents[];
};

// ─── Activity Types ─────────────────────────────────────────────────────────

export type ActivityWithUser = Activity & {
  user: Pick<User, "id" | "name" | "email" | "image">;
};

// ─── Time Entry Types ──────────────────────────────────────────────────────

export type TimeEntryWithDetails = TimeEntry & {
  task: Pick<Task, "id" | "title" | "listId">;
  user: Pick<User, "id" | "name" | "email" | "image">;
};

// ─── Custom Field Types ────────────────────────────────────────────────

export type CustomFieldWithValues = CustomField & {
  values: CustomFieldValue[];
};

export type CustomFieldValueWithField = CustomFieldValue & {
  field: CustomField;
};

// ─── Task Dependency Types ─────────────────────────────────────────────

export type TaskDependencyWithTask = TaskDependency & {
  dependentTask: Pick<Task, "id" | "title" | "priority"> & { status: Status };
  dependencyTask: Pick<Task, "id" | "title" | "priority"> & { status: Status };
};

// ─── Favorite Types ────────────────────────────────────────────────────────

export type FavoriteWithDetails = Favorite & {
  name: string;
  color?: string | null;
  icon?: string;
};

// ─── Session Extension ──────────────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
