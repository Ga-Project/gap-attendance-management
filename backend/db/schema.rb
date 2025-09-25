# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2025_09_25_105125) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "attendance_records", force: :cascade do |t|
    t.bigint "attendance_id", null: false
    t.integer "record_type"
    t.datetime "timestamp"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["attendance_id"], name: "index_attendance_records_on_attendance_id"
  end

  create_table "attendances", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.date "date", null: false
    t.datetime "clock_in_time"
    t.datetime "clock_out_time"
    t.integer "total_work_minutes", default: 0
    t.integer "total_break_minutes", default: 0
    t.integer "status", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["date"], name: "index_attendances_on_date"
    t.index ["status"], name: "index_attendances_on_status"
    t.index ["user_id", "date"], name: "index_attendances_on_user_id_and_date", unique: true
    t.index ["user_id"], name: "index_attendances_on_user_id"
  end

  create_table "audit_logs", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "target_user_id", null: false
    t.string "action", null: false
    t.json "change_data"
    t.text "reason", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["action"], name: "index_audit_logs_on_action"
    t.index ["created_at"], name: "index_audit_logs_on_created_at"
    t.index ["target_user_id", "created_at"], name: "index_audit_logs_on_target_user_id_and_created_at"
    t.index ["target_user_id"], name: "index_audit_logs_on_target_user_id"
    t.index ["user_id"], name: "index_audit_logs_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "google_id"
    t.string "email"
    t.string "name"
    t.integer "role"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["google_id"], name: "index_users_on_google_id", unique: true
  end

  add_foreign_key "attendance_records", "attendances"
  add_foreign_key "attendances", "users"
  add_foreign_key "audit_logs", "users"
  add_foreign_key "audit_logs", "users", column: "target_user_id"
end
