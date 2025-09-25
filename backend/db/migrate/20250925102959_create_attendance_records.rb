class CreateAttendanceRecords < ActiveRecord::Migration[7.1]
  def change
    create_table :attendance_records do |t|
      t.references :attendance, null: false, foreign_key: true
      t.integer :record_type
      t.datetime :timestamp

      t.timestamps
    end
  end
end
