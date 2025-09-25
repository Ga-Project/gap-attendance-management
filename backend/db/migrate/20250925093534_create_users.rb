class CreateUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :users do |t|
      t.string :google_id
      t.string :email
      t.string :name
      t.integer :role

      t.timestamps
    end
    add_index :users, :google_id, unique: true
    add_index :users, :email, unique: true
  end
end
