class CreateAttendances < ActiveRecord::Migration[7.1]
  def change
    create_table :attendances do |t|
      t.references :user, null: false, foreign_key: true
      t.date :date, null: false
      t.datetime :clock_in_time
      t.datetime :clock_out_time
      t.integer :total_work_minutes, default: 0
      t.integer :total_break_minutes, default: 0
      t.integer :status, null: false, default: 0

      t.timestamps
    end

    # Ensure one attendance record per user per date
    add_index :attendances, [:user_id, :date], unique: true
    # Index for efficient date-based queries
    add_index :attendances, :date
    # Index for status-based queries
    add_index :attendances, :status
  end
end
