export type WorkspaceJoinRequestDto = {
  id: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
};
