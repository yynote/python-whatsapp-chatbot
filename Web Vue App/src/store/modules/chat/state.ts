export interface ChatState {
  socket: SocketIOClient.Socket;
  dropped: boolean;
  activeGroupUser: ActiveGroupUser;
  activeRoom: (Group & Friend) | null; // Nick's whole messages
  groupGather: GroupGather;
  userGather: FriendGather;
  friendGather: FriendGather;
  unReadGather: UnReadGather;
  selectUser: (Group & Friend) | null;
  userInfo: Friend[]

}

const chatState: ChatState = {
  // @ts-ignore
  socket: null,
  dropped: false,
  activeGroupUser: {},
  activeRoom: null,  // Nick's whole messages
  userInfo: [],
  groupGather: {},
  userGather: {},
  friendGather: {},
  unReadGather: {},
  selectUser: null
};

export default chatState;
