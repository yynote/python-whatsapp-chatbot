import { ActionTree } from 'vuex';
import { ChatState } from './state';
import { RootState } from '../../index';
import io from 'socket.io-client';
import Vue from 'vue';
import {
  SET_SOCKET,
  SET_DROPPED,
  SET_ACTIVE_GROUP_USER,
  ADD_GROUP_MESSAGE,
  ADD_FRIEND_MESSAGE,
  SET_FRIEND_MESSAGES,
  SET_GROUP_GATHER,
  SET_FRIEND_GATHER,
  SET_USER_GATHER,
  SET_ACTIVE_ROOM,
  SET_USER_INFO,
  INSERT_USER_INFO,
  DEL_GROUP,
  DEL_FRIEND,
  ADD_UNREAD_GATHER,
} from './mutation-types';
import { DEFAULT_GROUP } from '@/const/index';

const actions: ActionTree<ChatState, RootState> = {
  // Initialize socket connection and listen to socket events
  async connectSocket({ commit, state, dispatch, rootState }, callback) {
    // let user = rootState.app.user;
    let user = "nick"
    let socket: SocketIOClient.Socket = io.connect(`http://localhost:8000/?userId=${user}`, { reconnection: true });
    socket.on('connect', async () => {
      console.log('connection succeeded');

      // Get all the info you need for a chat room
      socket.emit('chatData');

      // Save the socket object first(mutations)
      commit(SET_SOCKET, socket);
    });
    
    socket.on('wholeMsg', (data: []) =>{
      console.log('updateMsg', data)
      const date = new Date();
      const time = date.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric', hour12: true });
      const dateString = date.toLocaleDateString();

      const formattedDate = `${time} ${dateString}`;
      let temp = {
        userId: "Nick",
        username: "Nick",
        avatar: "",
        role: "",
        tag: "",
        unreadMsg: 0,
        messages: [],
        createTime: formattedDate
      }
      data.map((index) => {
        let submessage = {
          userId: index["from"], // who sent
          friendId: index["to"], // to who?
          content: index["message"], // message
          messageType: "text",
          time: index["time"],
          type: "",
          view: index["view"]
        }
        temp.messages.push(submessage)
      }) 
      let userTemp = [];
      temp.messages.filter((value, index) => {
        userTemp.push(value["userId"])
        // console.log("userTemp",value["userId"],index, temp.messages.indexOf(value["userId"]))
      })
      let users = userTemp.filter((value, index) => 
        userTemp.indexOf(value) === index
      )
      console.log('user', users)
      let temp_user = []
      users.map(index =>{
        if(index !="Nick" && index !="bot"){
          temp_user.push(index)
        }
      });
      users = temp_user
      let usersInfo = [], userInfo={}
      users.map((value) => {
        userInfo = {
          userId: value,
          username: value,
          avatar: "",
          role: "",
          tag: "",
          unreadMsg: 0,
          messages: [],
          createTime: 0
        }
        let count = 0;
        temp.messages.map((element) => {
          if(value == element["userId"] || value == element["friendId"]){
              if(element["view"] == "off" && value == element["userId"])
              {
                count++;
              }
              userInfo.messages.push({
              userId: element["userId"], // who sent
              friendId: element["friendId"], // to who?
              content: element["content"], // message
              messageType: "text",
              time: element["time"],
              type: "",
              view: false
            })
          }
        })
        userInfo.unreadMsg = count;
        count = 0; 
        usersInfo.push(userInfo)

      })
      console.log('users',usersInfo)

      commit(SET_ACTIVE_ROOM, temp);
      commit(SET_USER_INFO, usersInfo);



    })

    socket.on('updateMsg', (data: any) => {
      console.log('updata', data)
      commit(INSERT_USER_INFO, data);

    })
    // Initialize event listener
    socket.on('activeGroupUser', (data: any) => {
      console.log('activeGroupUser', data);
      commit(SET_ACTIVE_GROUP_USER, data.data);
    });

    socket.on('addGroup', (res: ServerRes) => {
      console.log('on addGroup', res);
      if (res.code) {
        return Vue.prototype.$message.error(res.msg);
      }
      Vue.prototype.$message.success(res.msg);
      commit(SET_GROUP_GATHER, res.data);
    });

    socket.on('joinGroup', async (res: ServerRes) => {
      console.log('on joinGroup', res);
      if (res.code) {
        return Vue.prototype.$message.error(res.msg);
      }
      let newUser = res.data.user;
      let group = res.data.group;
      if (newUser.userId != user.userId) {
        commit(SET_USER_GATHER, newUser);
        return Vue.prototype.$message.info(`${newUser.username}join the group${group.groupName}`);
      } else {
        console.log(state.groupGather, group.groupId);
        // If it is the user himself, join a group
        if (!state.groupGather[group.groupId]) {
          commit(SET_GROUP_GATHER, group);
          // Get the user information of all users in the group
          socket.emit('chatData', user);
        }
        Vue.prototype.$message.info(`Successfully joined the group${group.groupName}`);
        commit(SET_ACTIVE_ROOM, state.groupGather[group.groupId]);
      }
    });

    socket.on('joinGroupSocket', (res: ServerRes) => {
      console.log('on joinGroupSocket', res);
      if (res.code) {
        return Vue.prototype.$message.error(res.msg);
      }
      let newUser: Friend = res.data.user;
      let group: Group = res.data.group;
      let friendGather = state.friendGather;
      if (newUser.userId != user.userId) {
        commit(SET_USER_GATHER, newUser);
        if (friendGather[newUser.userId]) {
          // When the user's friends update the user information
          let messages;
          if (friendGather[newUser.userId].messages) {
            messages = friendGather[newUser.userId].messages;
          }
          commit(SET_FRIEND_GATHER, newUser);
          commit(SET_FRIEND_MESSAGES, messages);
        }
        // @ts-ignore Solve the problem of repeated group messages
        if (window.msg === newUser.userId) {
          return;
        }
        // @ts-ignore
        window.msg = newUser.userId;
        return Vue.prototype.$message.info(`${newUser.username}Join the group${group.groupName}`);
      } else {
        if (!state.groupGather[group.groupId]) {
          commit(SET_GROUP_GATHER, group);
        }
        commit(SET_USER_GATHER, newUser);
      }
    });

    socket.on('groupMessage', (res: ServerRes) => {
      console.log('on groupMessage', res);
      if (!res.code) {
        commit(ADD_GROUP_MESSAGE, res.data);
        let activeRoom = state.activeRoom;
        if (activeRoom && activeRoom.groupId !== res.data.groupId) {
          commit(ADD_UNREAD_GATHER, res.data.groupId);
        }
      } else {
        Vue.prototype.$message.error(res.msg);
      }
    });

    socket.on('addFriend', (res: ServerRes) => {
      console.log('on addFriend', res);
      if (!res.code) {
        commit(SET_FRIEND_GATHER, res.data);
        commit(SET_USER_GATHER, res.data);
        Vue.prototype.$message.info(res.msg);
        socket.emit('joinFriendSocket', {
          userId: user.userId,
          friendId: res.data.userId,
        });
      } else {
        Vue.prototype.$message.error(res.msg);
      }
    });

    socket.on('joinFriendSocket', (res: ServerRes) => {
      console.log('on joinFriendSocket', res);
      if (!res.code) {
        console.log('Successfully joined the private chat room');
      }
    });

    socket.on('friendMessage', (res: ServerRes) => {
      console.log('on friendMessage', res);
      if (!res.code) {
        if (res.data.friendId === user.userId || res.data.userId === user.userId) {
          console.log('ADD_FRIEND_MESSAGE', res.data);
          commit(ADD_FRIEND_MESSAGE, res.data);
          let activeRoom = state.activeRoom;
          if (activeRoom && activeRoom.userId !== res.data.userId && activeRoom.userId !== res.data.friendId) {
            commit(ADD_UNREAD_GATHER, res.data.userId);
          }
        }
      } else {
        Vue.prototype.$message.error(res.msg);
      }
    });

    socket.on('chatData', (res: ServerRes) => {
      if (res.code) {
        return Vue.prototype.$message.error(res.msg);
      }
      dispatch('handleChatData', res.data);
      commit(SET_DROPPED, false);
    });

    socket.on('exitGroup', (res: ServerRes) => {
      if (!res.code) {
        commit(DEL_GROUP, res.data);
        commit(SET_ACTIVE_ROOM, state.groupGather[DEFAULT_GROUP]);
        Vue.prototype.$message.success(res.msg);
      } else {
        Vue.prototype.$message.error(res.msg);
      }
    });

    socket.on('exitFriend', (res: ServerRes) => {
      if (!res.code) {
        commit(DEL_FRIEND, res.data);
        commit(SET_ACTIVE_ROOM, state.groupGather[DEFAULT_GROUP]);
        Vue.prototype.$message.success(res.msg);
      } else {
        Vue.prototype.$message.error(res.msg);
      }
    });
  },

  async handleChatData({ commit, dispatch, state, rootState }, payload) {
    let user = rootState.app.user;
    let socket = state.socket;
    let groupGather = state.groupGather;
    let groupArr = payload.groupData;
    let friendArr = payload.friendData;
    let userArr = payload.userData;
    if (groupArr.length) {
      for (let group of groupArr) {
        socket.emit('joinGroupSocket', {
          groupId: group.groupId,
          userId: user.userId,
        });
        commit(SET_GROUP_GATHER, group);
      }
    }
    if (friendArr.length) {
      for (let friend of friendArr) {
        socket.emit('joinFriendSocket', {
          userId: user.userId,
          friendId: friend.userId,
        });
        commit(SET_FRIEND_GATHER, friend);
      }
    }
    if (userArr.length) {
      for (let user of userArr) {
        commit(SET_USER_GATHER, user);
      }
    }

    /**
     * Since both groupgather and userGather have been updated, 
     * activeGather is still an old object,
     * Here you need to find the latest gather object based on the old activeGather, 
     * so that the vue watch can monitor the new gather
     */

    let activeRoom = state.activeRoom;
    let groupGather2 = state.groupGather;
    let friendGather2 = state.friendGather;
    if (!activeRoom) {
      // After updating the data, there is no default activeRoom setting group as 'Astro Boy Chat Room'
      return commit(SET_ACTIVE_ROOM, groupGather[DEFAULT_GROUP]);
    }
    commit(SET_ACTIVE_ROOM, groupGather2[activeRoom.groupId] || friendGather2[activeRoom.userId]);
  },
};

export default actions;
