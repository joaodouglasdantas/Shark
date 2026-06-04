class CreateLoans < ActiveRecord::Migration[7.1]
  def change
    create_table :loans do |t|
      t.references :user, null: false, foreign_key: true
      t.string  :name,               null: false
      t.string  :kind,               null: false                    
      t.decimal :total_amount,       null: false, precision: 12, scale: 2
      t.decimal :interest_rate,                   precision: 5,  scale: 2  
      t.integer :installments_count                                
      t.date    :start_date,         null: false
      t.date    :due_date
      t.string  :status,             null: false, default: "active"
      t.text    :notes

      t.timestamps
    end

    add_index :loans, [:user_id, :status]
    add_index :loans, [:user_id, :kind]
  end
end
