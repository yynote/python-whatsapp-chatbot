import Vue from 'vue';
import 'ant-design-vue/dist/antd.less';
  
import  TextArea  from 'ant-design-vue';
import {
  message,
  Button,
  Input,
  Modal,
  Form,
  Checkbox,
  Icon,
  Tabs,
  Popover,
  Dropdown,
  Menu,
  Avatar,
  Card,
  Select,
  Upload,
  Tooltip,
  Drawer,
  Popconfirm,
  Badge,
  Row,
  Col,
  Switch,
  } from 'ant-design-vue';

Vue.use(Avatar);
Vue.use(Button);
Vue.use(Input);
Vue.use(TextArea);
Vue.use(Modal);
Vue.use(Form);
Vue.use(Checkbox);
Vue.use(Icon);
Vue.use(Tabs);
Vue.use(Popover);
Vue.use(Dropdown);
Vue.use(Menu);
Vue.use(Card);
Vue.use(Select);
Vue.use(Upload);
Vue.use(Tooltip);
Vue.use(Drawer);
Vue.use(Popconfirm);
Vue.use(Badge);
Vue.use(Row);
Vue.use(Col);
Vue.use(Switch);

Vue.prototype.$message = message;
