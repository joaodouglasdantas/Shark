class CreateLoanPayments < ActiveRecord::Migration[7.1]
  def change
    create_table :loan_payments do |t|
      t.references :loan, null: false, foreign_key: true
      t.decimal :amount,             null: false, precision: 12, scale: 2
      t.date    :paid_on,            null: false
      t.integer :installment_number
      t.string  :notes

      t.timestamps
    end

    add_index :loan_payments, [:loan_id, :paid_on]
  end
end
