<template>
  <div class="app-container">
    <div class="filter-container">
      <el-form :model="data" label-width="80px" label-position="right">
        <el-form-item class="filter-item" label="AppName">
          <el-input v-model="listQuery.customParams.appName" placeholder="请输入AppName" />
        </el-form-item>
        <el-form-item class="filter-item" label="名称">
          <el-input v-model="listQuery.customParams.title" placeholder="请输入名称" />
        </el-form-item>
        <el-button v-waves class="filter-item" style="margin-left: 20px;" type="primary" icon="el-icon-search" @click="handleFilter">
          查询
        </el-button>
        <el-button class="filter-item" type="primary" @click="handleAdd">新增</el-button>
      </el-form>
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
      <el-table-column label="AppName" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.appName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="名称" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.title }}</span>
        </template>
      </el-table-column>
      <el-table-column label="注册方式" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.addressType === 0 ? '自动注册' : '手动注册' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="OnLine 机器地址" align="center" width="300">
        <template slot-scope="scope">
          <a style="color: #3b91b6;">{{ scope.row.addressList }}</a>
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

        }
      },
      dialogType: 'new',
      dialogVisible: false
    }
  },
  computed: {},
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.listLoading = true
      requestByClient(Xxl, 'post', '/jobgroup/page', this.listQuery, resp => {
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
</style>
