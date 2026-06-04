class CreateTransactions < ActiveRecord::Migration[7.1]
  def change
    create_table :transactions do |t|
      t.references :user,     null: false, foreign_key: true
      t.references :category, null: false, foreign_key: true
      t.decimal :amount, precision: 12, scale: 2, null: false
      t.string  :kind, null: false
      t.string  :description
      t.date    :date, null: false

      t.timestamps
    end

    add_index :transactions, [:user_id, :date]
    add_index :transactions, [:user_id, :kind]
  end
end
