class RenameChangesToChangeDataInAuditLogs < ActiveRecord::Migration[7.1]
  def change
    rename_column :audit_logs, :changes, :change_data
  end
end
