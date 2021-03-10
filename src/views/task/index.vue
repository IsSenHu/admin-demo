<template>
  <div class="app-container">
    <div class="filter-container">
      <div class="filter-item">
        执行器
        <el-select v-model="listQuery.customParams.jobGroup" style="width: 120px;" placeholder="请选择">
          <el-option
            v-for="item in groups"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
      <div class="filter-item">
        <el-select v-model="listQuery.customParams.triggerStatus" style="width: 120px;" placeholder="请选择">
          <el-option
            v-for="item in status"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
      <div class="filter-item">
        <el-input v-model="listQuery.customParams.jobDesc" style="display: inline-block;" placeholder="请输入任务描述" />
      </div>
      <div class="filter-item">
        <el-input v-model="listQuery.customParams.executorHandler" style="display: inline-block;" placeholder="请输入jobHandler" />
      </div>
      <div class="filter-item">
        <el-input v-model="listQuery.customParams.author" style="display: inline-block;" placeholder="请输入负责人" />
      </div>
      <el-button v-waves class="filter-item" style="margin-left: 20px;" type="primary" icon="el-icon-search" @click="handleFilter">
        查询
      </el-button>
      <el-button class="filter-item" type="primary" @click="handleAdd">新增</el-button>
    </div>

    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;"
      @sort-change="sortChange"
    >
      <el-table-column label="任务ID" align="center" width="50">
        <template slot-scope="scope">
          <span>{{ scope.row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="任务描述" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.jobDesc }}</span>
        </template>
      </el-table-column>
      <el-table-column label="运行模式" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.glueType + ': ' + scope.row.executorHandler }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Cron" align="center" width="150px">
        <template slot-scope="scope">
          <span>{{ scope.row.jobCron }}</span>
        </template>
      </el-table-column>
      <el-table-column label="负责人" align="center" width="150px">
        <template slot-scope="scope">
          <span>{{ scope.row.author }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" width="150px">
        <template slot-scope="scope">
          <el-tag :type="scope.row.triggerStatus === 1 ? 'success': 'danger'">{{ scope.row.triggerStatus === 1 ? 'running' : 'stop' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作" width="200">
        <template slot-scope="scope">
          <el-dropdown @command="handleCommand">
            <el-button type="primary">
              操作<i class="el-icon-arrow-down el-icon--right" />
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item :command="'a-' + scope.row.id">执行一次</el-dropdown-item>
              <el-dropdown-item :command="'b-' + scope.row.id">查询日志</el-dropdown-item>
              <el-dropdown-item :command="'c-' + scope.row.id">注册节点</el-dropdown-item>
              <el-dropdown-item :command="'d-' + scope.row.id">下次执行时间</el-dropdown-item>
              <el-dropdown-item :command="'e-' + scope.row.id" divided>{{ scope.row.triggerStatus === 1 ? '停止' : '启动' }}</el-dropdown-item>
              <el-dropdown-item :command="'f-' + scope.row.id">编辑</el-dropdown-item>
              <el-dropdown-item :command="'g-' + scope.row.id">删除</el-dropdown-item>
              <el-dropdown-item :command="'h-' + scope.row.id">复制</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.number"
      @pagination="getList"
    />

    <el-dialog :visible.sync="onceDialogVisible" title="执行一次">
      <el-form :model="data" label-width="80px" label-position="left">
        <el-form-item label="任务参数">
          <el-input v-model="triggerParams" type="textarea" :autosize="{ minRows: 2, maxRows: 4}" placeholder="任务参数" />
        </el-form-item>
        <el-form-item label="机器地址">
          <el-input v-model="triggerAddress" type="textarea" :autosize="{ minRows: 2, maxRows: 4}" placeholder="机器地址" />
        </el-form-item>
      </el-form>
      <div style="text-align: center;">
        <el-button type="danger" @click="onceDialogVisible=false">取消</el-button>
        <el-button type="primary" @click="submitTrigger">确认</el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="dialogVisible" :title="dialogType === 'edit' ? '编辑' : '新增'">
      <el-form :inline="true" :model="data" label-width="100px" label-position="left">
        <el-form-item label="执行器">
          <el-select
            v-model="data.jobGroup"
            filterable
            allow-create
            default-first-option
            style="width: 200px;"
            placeholder="请选择"
          >
            <el-option
              v-for="item in groups"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input v-model="data.jobDesc" style="width: 200px;" placeholder="请输入任务描述" />
        </el-form-item>
        <el-form-item label="路由策略">
          <el-select
            v-model="data.executorRouteStrategy"
            filterable
            allow-create
            default-first-option
            style="width: 200px;"
            placeholder="请选择"
          >
            <el-option
              v-for="item in routeStrategies"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Cron">
          <el-popover v-model="cronPopover">
            <cron v-model="data.jobCron" i18n="cn" @change="changeCron" @close="cronPopover=false" />
            <el-input slot="reference" v-model="data.jobCron" style="width: 200px;" placeholder="请输入定时策略" @click="cronPopover=true" />
          </el-popover>
        </el-form-item>
        <el-form-item label="运行模式">
          <el-select
            v-if="modeEnable"
            v-model="data.glueType"
            allow-create
            default-first-option
            style="width: 200px;"
            placeholder="请选择"
          >
            <el-option
              v-for="item in modes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-select
            v-else
            disabled
            v-model="data.glueType"
            allow-create
            default-first-option
            style="width: 200px;"
            placeholder="请选择"
          >
            <el-option
              v-for="item in modes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="jobHandler">
          <el-input v-model="data.executorHandler" style="width: 200px;" placeholder="请输入jobHandler" />
        </el-form-item>
        <el-form-item label="阻塞处理策略">
          <el-select
            v-model="data.executorBlockStrategy"
            filterable
            allow-create
            default-first-option
            style="width: 200px;"
            placeholder="请选择"
          >
            <el-option
              v-for="item in blockStrategies"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="子任务ID">
          <el-input v-model="data.childJobId" style="width: 200px;" placeholder="请输入子任务ID，如果存在多个则逗号分割" />
        </el-form-item>
        <el-form-item label="任务超时时间">
          <el-input v-model="data.executorTimeout" style="width: 200px;" placeholder="请输入任务超时时间" />
        </el-form-item>
        <el-form-item label="失败重试次数">
          <el-input v-model="data.executorFailRetryCount" style="width: 200px;" placeholder="失败重试次数，大于0时有效" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="data.author" style="width: 200px;" placeholder="请输入负责人" />
        </el-form-item>
        <el-form-item label="报警邮件">
          <el-input v-model="data.alarmEmail" style="width: 200px;" placeholder="报警邮件，多个邮件地址则逗号分割" />
        </el-form-item>
        <el-form-item label="任务参数">
          <el-input v-model="data.executorParam" style="width: 500px;" type="textarea" :autosize="{ minRows: 2, maxRows: 10}" placeholder="AppName" />
        </el-form-item>
      </el-form>
      <div style="text-align:center;">
        <el-button type="danger" @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="submitMethod">提交</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>import Vue from 'vue'
import waves from '../../directive/waves'
import Pagination from '../../components/Pagination'
import { Xxl, requestByClient } from '../../utils/HttpUtils'
import VueCron from 'vue-cron'
Vue.use(VueCron)
import { cron } from 'vue-cron'

const defaultData = {
  id: null,
  jobGroup: '',
  jobCron: '',
  jobDesc: '',
  addTime: null,
  updateTime: null,
  author: '',
  alarmEmail: '',
  executorRouteStrategy: '',
  executorHandler: '',
  executorParam: '',
  executorBlockStrategy: '',
  executorTimeout: 0,
  executorFailRetryCount: 0,
  glueType: '',
  glueSource: '',
  glueRemark: '',
  glueUpdatetime: null,
  childJobId: 0,
  triggerStatus: 0,
  triggerLastTime: null,
  triggerNextTime: null
}

export default {
  name: 'Group',
  components: { Pagination, cron },
  directives: { waves },
  filters: {},
  data() {
    return {
      cronPopover: false,
      triggerOnceId: null,
      triggerParams: '',
      triggerAddress: '',
      routeStrategies: [],
      modes: [],
      blockStrategies: [],
      groups: [],
      status: [
        {
          value: -1,
          label: '全部'
        },
        {
          value: 0,
          label: '停止'
        },
        {
          value: 1,
          label: '启动'
        }
      ],
      fileList: [],
      categories: [],
      categoriesLoading: false,
      tags: [{
        value: 0,
        label: '自动注册'
      }, {
        value: 1,
        label: '手动输入'
      }],
      addTag: '',
      data: Object.assign({}, defaultData),
      tableKey: 0,
      list: null,
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        number: 20,
        sort: 'time',
        asc: true,
        customParams: {
          jobGroup: '',
          jobDesc: '',
          executorHandler: '',
          author: '',
          triggerStatus: -1
        }
      },
      dialogType: 'new',
      dialogVisible: false,
      onceDialogVisible: false,
      nextTimes: [],
      modeEnable: true
    }
  },
  computed: {},
  created() {
    requestByClient(Xxl, 'get', '/joblog/filterJobGroupByRole', null, resp => {
      const respJson = resp.data
      const { code, data } = respJson
      if (code === 0 && data) {
        const groups = []
        data.forEach(item => {
          groups.push({
            value: item.id,
            label: item.appName
          })
        })
        this.groups = groups
      }
    })
    requestByClient(Xxl, 'get', '/jobinfo/getEnums', null, resp => {
      const respJson = resp.data
      const { code, data } = respJson
      if (code === 0 && data) {
        this.routeStrategies = []
        data.ExecutorRouteStrategyEnum.forEach(item => {
          this.routeStrategies.push({
            value: item.name,
            label: item.title
          })
        })
        this.modes = []
        data.GlueTypeEnum.forEach(item => {
          this.modes.push({
            value: item,
            label: item
          })
        })
        this.blockStrategies = []
        data.ExecutorBlockStrategyEnum.forEach(item => {
          this.blockStrategies.push({
            value: item,
            label: item
          })
        })
      }
    })
    this.getList()
  },
  methods: {
    changeCron(val) {
      this.data.jobCron = val
    },
    handleCommand(command) {
      const keyAndId = command.toString().split('-')
      const key = keyAndId[0]
      this.list.forEach(item => {
        if (item.id + '' === keyAndId[1]) {
          if (key === 'a') {
            this.executeOnce(item)
          } else if (key === 'b') {
            console.info('查询日志')
          } else if (key === 'c') {
            console.info('注册节点')
          } else if (key === 'd') {
            requestByClient(Xxl, 'post', '/jobinfo/newNextTriggerTime?cron=' + item.jobCron, null, resp => {
              const respJson = resp.data
              const { code, data } = respJson
              if (code === 0 && data) {
                this.nextTimes = data
                alert(this.nextTimes)
              }
            })
          } else if (key === 'e') {
            this.startOrStop(item)
          } else if (key === 'f') {
            this.editShow(item)
          } else if (key === 'g') {
            this.remove(item)
          } else if (key === 'h') {
            console.info('复制')
          }
        }
      })
    },
    remove(item) {
      requestByClient(Xxl, 'post', '/jobinfo/newRemove?id=' + item.id, null, resp => {
        const respJson = resp.data
        const { code, error } = respJson
        if (code === 0) {
          this.$notify({
            title: '成功',
            dangerouslyUseHTMLString: true,
            message: ``,
            type: 'success'
          })
          this.getList()
        } else {
          this.$notify({
            title: '失败',
            dangerouslyUseHTMLString: true,
            message: error,
            type: 'warning'
          })
        }
      })
    },
    startOrStop(item) {
      const url = item.triggerStatus === 1 ? '/jobinfo/newPause?id=' : '/jobinfo/newStart?id='
      requestByClient(Xxl, 'post', url + item.id, null, resp => {
        const respJson = resp.data
        const { code, error } = respJson
        if (code === 0) {
          item.triggerStatus = item.triggerStatus === 1 ? 2 : 1
          this.$notify({
            title: '成功',
            dangerouslyUseHTMLString: true,
            message: ``,
            type: 'success'
          })
        } else {
          this.$notify({
            title: '失败',
            dangerouslyUseHTMLString: true,
            message: error,
            type: 'warning'
          })
        }
      })
    },
    executeOnce(row) {
      this.onceDialogVisible = true
      this.triggerOnceId = row.id
      this.triggerParams = row.executorParam
    },
    submitTrigger() {
      requestByClient(Xxl, 'post', '/jobinfo/newTrigger?id=' + this.triggerOnceId + '&executorParam=' + this.triggerParams + '&addressList=' + this.triggerAddress, null, resp => {
        const respJson = resp.data
        const { code, error } = respJson
        if (code === 0) {
          this.$notify({
            title: '成功',
            dangerouslyUseHTMLString: true,
            message: ``,
            type: 'success'
          })
          this.onceDialogVisible = false
        } else {
          this.$notify({
            title: '失败',
            dangerouslyUseHTMLString: true,
            message: error,
            type: 'warning'
          })
        }
      })
    },
    getList() {
      this.listLoading = true
      requestByClient(Xxl, 'post', '/jobinfo/page', this.listQuery, resp => {
        const respJson = resp.data
        const { code } = respJson
        if (code === 0) {
          this.list = respJson.data.items
          this.total = respJson.data.total
        }
        this.listLoading = false
      })
    },
    sortChange(data) {
      const { prop, order } = data
      if (prop === 'time') {
        this.sortByTime(order)
      }
    },
    sortByTime(order) {
      if (order === 'ascending') {
        this.listQuery.sort = 'time'
        this.listQuery.asc = true
      } else {
        this.listQuery.sort = 'time'
        this.listQuery.asc = false
      }
      this.handleFilter()
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    getSortClass(filed) {
      const asc = this.listQuery.asc
      const sort = this.listQuery.sort
      if (sort === filed) {
        return asc ? 'ascending' : 'descending'
      } else {
        return ''
      }
    },
    addShow() {
      this.dialogType = 'new'
      this.dialogVisible = true
    },
    handleAdd() {
      this.data = Object.assign({}, defaultData)
      this.modeEnable = true
      this.addShow()
    },
    editShow(item) {
      this.data.id = item.id
      this.data.author = item.author
      this.data.executorParam = item.executorParam
      this.data.alarmEmail = item.alarmEmail
      this.data.executorFailRetryCount = item.executorFailRetryCount
      this.data.executorTimeout = item.executorTimeout
      this.data.childJobId = item.childJobId
      this.data.executorBlockStrategy = item.executorBlockStrategy
      this.data.executorHandler = item.executorHandler
      this.data.glueType = item.glueType
      this.data.executorRouteStrategy = item.executorRouteStrategy
      this.data.jobDesc = item.jobDesc
      this.data.jobGroup = item.jobGroup
      this.data.jobCron = item.jobCron
      this.modeEnable = false
      this.dialogType = 'edit'
      this.dialogVisible = true
    },
    handleEdit(scope) {
      this.editShow(scope.row.id)
    },
    handleDelete({ row }) {
      this.$confirm('确认要删除该执行器?', '警告', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async() => {
          requestByClient(Xxl, 'delete', '/jobgroup/' + row.id, null, resp => {
            const respJson = resp.data
            const { code, error } = respJson
            if (code === 0) {
              this.$notify({
                title: '成功',
                dangerouslyUseHTMLString: true,
                message: ``,
                type: 'success'
              })
              this.getList()
            } else {
              this.$notify({
                title: '失败',
                dangerouslyUseHTMLString: true,
                message: error,
                type: 'warning'
              })
            }
          })
        })
        .catch(err => {
          console.error(err)
        })
    },
    handleClose(tag) {
      this.blog.tags.splice(this.blog.tags.indexOf(tag), 1)
      this.tags.push({ 'value': tag, 'label': tag })
    },
    submitMethod() {
      let url
      if (this.dialogType === 'edit') {
        url = '/jobinfo/newUpdate'
      } else {
        url = '/jobinfo/newAdd'
      }
      this.dialogVisible = false
      requestByClient(Xxl, 'post', url, this.data, resp => {
        const respJson = resp.data
        const { code, error } = respJson
        if (code === 0) {
          this.$message({
            message: '成功',
            type: 'success'
          })
          this.getList()
        } else {
          this.$notify({
            title: '失败',
            dangerouslyUseHTMLString: true,
            message: error,
            type: 'warning'
          })
        }
      })
    }
  }
}
</script>

<style scoped>
  .filter-item {
    margin-left: 20px;
  }
</style>
