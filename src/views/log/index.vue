<template>
  <div class="app-container">
    <div class="filter-container">
      <div class="filter-item">
        执行器
        <el-select v-model="listQuery.customParams.jobGroup" style="width: 120px;" placeholder="请选择" @change="selectJobs">
          <el-option
            v-for="item in groups"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
      <div class="filter-item">
        任务
        <el-select v-model="listQuery.customParams.jobId" style="width: 120px;" placeholder="请选择">
          <el-option
            v-for="item in jobsOfGroup"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
      <div class="filter-item">
        状态
        <el-select v-model="listQuery.customParams.triggerCode" style="width: 120px;" placeholder="请选择">
          <el-option
            v-for="item in triggerStatus"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
      <div class="filter-item">
        调度时间
        <el-date-picker
          v-model="value1"
          type="datetimerange"
          :picker-options="pickerOptions"
          value-format="yyyy-MM-dd HH:mm:ss"
          range-separator=" - "
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          align="right"
        >
        </el-date-picker>
      </div>
      <el-button v-waves class="filter-item" style="margin-left: 20px;" type="primary" icon="el-icon-search" @click="handleFilter">
        查询
      </el-button>
    </div>

    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;"
      :cell-style="cellStyle"
      @sort-change="sortChange"
    >
      <el-table-column label="任务ID" align="center" width="60">
        <template slot-scope="scope">
          <span>{{ scope.row.jobId }}</span>
        </template>
      </el-table-column>
      <el-table-column label="调度时间" align="center" width="160">
        <template slot-scope="scope">
          <span>{{ scope.row.triggerTime }}</span>
        </template>
      </el-table-column>
      <el-table-column label="调度结果" align="center">
        <template slot-scope="scope">
          <span>{{ checkTriggerType(scope.row.triggerCode) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="调度备注" align="center">
        <template slot-scope="scope">
          <el-popover
            placement="bottom"
            title="调度结果"
            width="500"
            trigger="click"
          >
            <div class="popover-content" v-html="triggerHtml" />
            <el-button slot="reference" @click="showPop(scope.row.triggerMsg)">查看</el-button>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column label="执行时间" align="center" width="160">
        <template slot-scope="scope">
          <span>{{ scope.row.handleTime }}</span>
        </template>
      </el-table-column>
      <el-table-column label="执行结果" align="center">
        <template slot-scope="scope">
          <span>{{ checkHandlerType(scope.row.handleCode) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="执行备注" align="center" width="300">
        <template slot-scope="scope">
          <span>{{ scope.row.handleMsg }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作" width="200">
        <template slot-scope="scope">
          <el-button type="primary" size="small" @click="handleEdit(scope)">执行日志</el-button>
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

    <el-dialog :visible.sync="dialogVisible" :title="dialogType === 'edit' ? '编辑' : '新增'">
      <el-form :model="data" label-width="80px" label-position="left">
        <el-form-item label="AppName">
          <el-input v-model="data.appName" placeholder="AppName" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="data.title" placeholder="名称" />
        </el-form-item>
        <el-form-item label="注册方式">
          <el-select
            v-model="data.addressType"
            filterable
            allow-create
            default-first-option
            placeholder="请选择"
          >
            <el-option
              v-for="item in tags"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="机器地址">
          <el-input v-model="data.addressList" type="textarea" :autosize="{ minRows: 2, maxRows: 4}" placeholder="机器地址" />
        </el-form-item>
      </el-form>
      <div style="text-align:right;">
        <el-button type="danger" @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="submitMethod">提交</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import waves from '../../directive/waves'
import Pagination from '../../components/Pagination'
import { Xxl, requestByClient } from '../../utils/HttpUtils'

const defaultData = {
  id: null,
  appName: '',
  title: '',
  addressType: 0,
  addressList: '',
  registryList: []
}

export default {
  name: 'Group',
  components: { Pagination },
  directives: { waves },
  filters: {},
  data() {
    return {
      value1: '',
      pickerOptions: {
        shortcuts: [{
          text: '最近一周',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: '最近一个月',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: '最近三个月',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
            picker.$emit('pick', [start, end])
          }
        }]
      },
      triggerHtml: '',
      triggerStatus: [
        {
          value: 0,
          label: '全部'
        },
        {
          value: 1,
          label: '成功'
        },
        {
          value: 2,
          label: '失败'
        },
        {
          value: 3,
          label: '进行中'
        }
      ],
      groups: [],
      jobsOfGroup: [
        {
          value: 0,
          label: '全部'
        }
      ],
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
          triggerCode: 0,
          jobGroup: 0,
          jobId: 0
        }
      },
      dialogType: 'new',
      dialogVisible: false
    }
  },
  computed: {},
  created() {
    requestByClient(Xxl, 'get', '/joblog/filterJobGroupByRole', null, resp => {
      const respJson = resp.data
      const { code, data } = respJson
      if (code === 0 && data) {
        const groups = [{
          value: 0,
          label: '全部'
        }]
        data.forEach(item => {
          groups.push({
            value: item.id,
            label: item.appName
          })
        })
        this.groups = groups
      }
    })
    this.getList()
  },
  methods: {
    selectJobs() {
      const jobGroup = this.listQuery.customParams.jobGroup
      if (jobGroup !== 0) {
        requestByClient(Xxl, 'get', '/joblog/newGetJobsByGroup?jobGroup=' + jobGroup, null, resp => {
          const respJson = resp.data
          const { code, data } = respJson
          if (code === 0 && data) {
            const newJobs = [{
              value: 0,
              label: '全部'
            }]
            data.forEach(item => {
              newJobs.push({
                value: item.id,
                label: item.jobDesc
              })
            })
            this.jobsOfGroup = newJobs
            this.listQuery.customParams.jobId = 0
          }
        })
      } else {
        this.jobsOfGroup = [{
          value: 0,
          label: '全部'
        }]
        this.listQuery.customParams.jobId = 0
      }
    },
    showPop(msg) {
      if (msg && msg !== '') {
        this.triggerHtml = msg
      } else {
        this.triggerHtml = '无'
      }
    },
    cellStyle(data) {
      if (data.columnIndex === 2) {
        if (data.row.triggerCode === 200) {
          return 'color: green; font-weight: bold;'
        } else if (data.row.triggerCode === 500) {
          return 'color: red; font-weight: bold;'
        } else {
          return ''
        }
      } else if (data.columnIndex === 5) {
        if (data.row.handleCode === 200) {
          return 'color: green; font-weight: bold;'
        } else if (data.row.handleCode === 500 || data.row.handleCode === 502) {
          return 'color: red; font-weight: bold;'
        } else {
          return ''
        }
      }
      return ''
    },
    checkTriggerType(code) {
      return code === 200 ? '成功' : code === 500 ? '失败' : ''
    },
    checkHandlerType(code) {
      return code === 200 ? '成功' : code === 500 ? '失败' : code === 502 ? '失败(超时)' : ''
    },
    getList() {
      this.listLoading = true
      if (this.value1 && this.value1.length === 2) {
        this.listQuery.customParams.filterTime = this.value1[0] + ' - ' + this.value1[1]
      } else {
        this.listQuery.customParams.filterTime = ''
      }
      requestByClient(Xxl, 'post', '/joblog/page', this.listQuery, resp => {
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
      this.addShow()
    },
    editShow(id) {
      requestByClient(Xxl, 'get', '/jobgroup/findById/' + id, null, resp => {
        const respJson = resp.data
        const { code, data } = respJson
        if (code === 0) {
          this.data.id = data.id
          this.data.title = data.title
          this.data.appName = data.appName
          this.data.addressType = data.addressType
          this.data.addressList = data.addressList
          this.data.registryList = data.registryList
          this.dialogType = 'edit'
          this.dialogVisible = true
        }
      })
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
        url = '/jobgroup/newUpdate'
      } else {
        url = '/jobgroup/newSave'
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
    font-size: 14px;
  }
</style>
