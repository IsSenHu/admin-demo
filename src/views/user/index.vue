<template>
  <div class="app-container">
    <div class="filter-container">
      <el-button v-waves class="filter-item" style="margin-left: 20px;" type="primary" icon="el-icon-search" @click="handleFilter">
        查询
      </el-button>
      <el-button v-waves class="filter-item" style="margin-left: 20px;" type="primary" @click="handleAdd">
        新增
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
      @sort-change="sortChange"
    >
      <el-table-column label="ID" align="center" width="50">
        <template slot-scope="scope">
          <span>{{ scope.row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="账号" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.username }}</span>
        </template>
      </el-table-column>
      <el-table-column label="角色" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.role === 0 ? '普通用户' : '管理员' }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作" width="200">
        <template slot-scope="scope">
          <el-button type="primary" size="small" @click="handleEdit(scope)">编辑</el-button>
          <el-button type="danger" size="small" @click="handleDelete(scope)">删除</el-button>
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
        <el-form-item label="账号">
          <el-input v-model="data.username" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item v-if="dialogType !== 'edit'" label="密码">
          <el-input v-model="data.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select
            v-model="data.role"
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
        <el-form-item v-if="data.role === 0" label="权限">
          <el-select
            v-model="data.permission"
            filterable
            allow-create
            default-first-option
            multiple
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
  username: '',
  password: '',
  permission: [],
  role: 0
}

export default {
  name: 'User',
  components: { Pagination },
  directives: { waves },
  filters: {},
  data() {
    return {
      fileList: [],
      categories: [],
      categoriesLoading: false,
      tags: [{
        value: 0,
        label: '普通用户'
      }, {
        value: 1,
        label: '管理员'
      }],
      groups: [],
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
          role: -1
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
        const groups = []
        data.forEach(item => {
          groups.push({
            value: item.id + '',
            label: item.appName
          })
        })
        this.groups = groups
      }
    })
    this.getList()
  },
  methods: {
    getList() {
      this.listLoading = true
      requestByClient(Xxl, 'post', '/user/page', this.listQuery, resp => {
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
    editShow(username) {
      requestByClient(Xxl, 'get', '/user/findByUsername/' + username, null, resp => {
        const respJson = resp.data
        const { code, data } = respJson
        if (code === 0) {
          this.data.id = data.id
          this.data.username = data.username
          this.data.role = data.role
          if (data.permission) {
            this.data.permission = data.permission.split(',')
          }
          this.dialogType = 'edit'
          this.dialogVisible = true
        }
      })
    },
    handleEdit(scope) {
      this.editShow(scope.row.username)
    },
    handleDelete({ row }) {
      this.$confirm('确认要删除该执行器?', '警告', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async() => {
          requestByClient(Xxl, 'post', '/user/newRemove/' + row.id, null, resp => {
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
        url = '/user/newUpdate'
      } else {
        url = '/user/newAdd'
      }
      this.dialogVisible = false
      console.log(this.data.permission)
      this.data.permission = this.data.permission.join(',')
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
</style>
