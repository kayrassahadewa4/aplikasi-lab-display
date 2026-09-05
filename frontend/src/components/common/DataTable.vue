<script setup lang="ts" generic="T">
export interface TableColumn<T = any> {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  width?: string
  class?: string
}

interface Props {
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  emptyText?: string
  rowKey?: string
}

withDefaults(defineProps<Props>(), {
  loading: false,
  emptyText: 'Tidak ada data tersedia',
  rowKey: 'id',
})

const emit = defineEmits<{
  rowClick: [row: T]
}>()

const handleRowClick = (row: T) => {
  emit('rowClick', row)
}

const getAlignClass = (align?: string) => {
  switch (align) {
    case 'center': return 'text-center'
    case 'right': return 'text-right'
    default: return 'text-left'
  }
}
</script>

<template>
  <div class="w-full overflow-x-auto rounded-xl border border-gray-200/70 shadow-2xs">
    <table class="min-w-full divide-y divide-gray-200/70">
      <!-- Header -->
      <thead class="bg-gradient-to-r from-emerald-50/70 via-brand-50/50 to-emerald-50/70 border-b border-brand-100">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :style="{ width: column.width }"
            :class="[
              'px-6 py-3.5 text-[11px] font-black text-emerald-950 uppercase tracking-wider',
              getAlignClass(column.align),
              column.class,
            ]"
          >
            <slot :name="`header-${column.key}`" :column="column">
              {{ column.label }}
            </slot>
          </th>
          <th v-if="$slots.actions" class="px-6 py-3.5 text-right text-[11px] font-black text-emerald-950 uppercase tracking-wider">
            Aksi
          </th>
        </tr>
      </thead>

      <!-- Body -->
      <tbody class="bg-white divide-y divide-gray-100">
        <!-- Loading State -->
        <tr v-if="loading">
          <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="px-6 py-12 text-center">
            <div class="flex justify-center">
              <div class="animate-spin rounded-full h-8 w-8 border-2 border-dark-green border-t-transparent"></div>
            </div>
          </td>
        </tr>

        <!-- Empty State -->
        <tr v-else-if="data.length === 0">
          <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="px-6 py-12 text-center text-text-muted text-xs font-medium">
            <slot name="empty">
              {{ emptyText }}
            </slot>
          </td>
        </tr>

        <!-- Data Rows -->
        <tr
          v-else
          v-for="(row, index) in data"
          :key="(row as any)[rowKey] || index"
          class="hover:bg-brand-50/60 transition-all duration-150 cursor-pointer relative group"
          @click="handleRowClick(row)"
        >
          <td
            v-for="column in columns"
            :key="column.key"
            :class="[
              'px-6 py-4 whitespace-nowrap text-xs text-text-primary',
              getAlignClass(column.align),
              column.class,
            ]"
          >
            <slot :name="`cell-${column.key}`" :row="row" :value="(row as any)[column.key]">
              {{ (row as any)[column.key] }}
            </slot>
          </td>
          <td v-if="$slots.actions" class="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
            <slot name="actions" :row="row" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
