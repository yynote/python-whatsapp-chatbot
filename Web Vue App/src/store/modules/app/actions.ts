import { SET_USER, SET_TOKEN } from './mutation-types';
import { ActionTree } from 'vuex';
import { AppState } from './state';
import { RootState } from '../../index';
import fetch from '@/api/fetch';
import { processReturn } from '@/utils/common.ts';

const actions: ActionTree<AppState, RootState> = {
  async register({ commit }, payload) {
    let res = await fetch.post('/auth/register', {
      ...payload,
    });
    let data = processReturn(res);
    if (data) {
      commit(SET_USER, data.user);
      commit(SET_TOKEN, data.token);
      return data;
    }
  },
  async login({ commit }, payload) {
    console.log('login', payload)
    // let res = await fetch.post('/auth/login', {
    //   ...payload,
    // });
    let res = {
      user: {
        userId: 'kkk@123',
        username: 'Nick',
        password: '123456!',
        avatar: '123',
        createTime: 154672,
      },
      token: 'wdsqw1432t4fyt45hju768t4q4r3276544ht45h3t436h',
      mobile: false,
      background: '',
    };
    // let data = processReturn(res);
    let data = res
    if (data) {
      commit(SET_USER, data.user);
      commit(SET_TOKEN, data.token);
      return data;
    }
  },
};

export default actions;
