const { expect } = require("chai")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

    //global constants for listing items
    const ID = 1
    const NAME = "Shoes"
    const CATEGORY = "Clothing"
    const IMAGE = "image"
    const COST = tokens(1)
    const RATING = 4
    const STOCK = 5

describe("Dappazon", () => {
  let dappazon;

  beforeEach(async ()=>{
    //setting up accounts
    [deployer, buyer] = await ethers.getSigners()
    //deploying contract
    const Dappazon = await ethers.getContractFactory("Dappazon")
    dappazon = await Dappazon.deploy()
  })
  //deployment description
  describe("deployment", async ()=>{
    it("Sets the owner", async()=>{
      const owner = await dappazon.owner()
      expect(owner).to.equal(deployer.address)
    })
    it('has a name', async ()=>{
      const name = await dappazon.name()
      expect(name).to.equal("Dappazon")
    })
  })

  //listing description
  describe("Listing", async ()=>{
    let transaction
    
    beforeEach(async () =>{
      //list an item
      transaction = await dappazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait()
    })
    it("Return item attributes", async ()=>{
      const item = await dappazon.items(ID)
      const costInEther = ethers.utils.formatUnits(item.cost, 'ether');
      //checking values
      expect(item.id.toNumber()).to.equal(ID)
      expect(item.name).to.equal(NAME)
      expect(item.category).to.equal(CATEGORY)
      expect(item.image).to.equal(IMAGE)
      expect(costInEther).to.equal(ethers.utils.formatUnits(COST, 'ether'))
      expect(item.rating.toNumber()).to.equal(RATING)
      expect(item.stock.toNumber()).to.equal(STOCK)
    })
    it("Emits List event", async ()=>{
      expect(transaction).to.emit(dappazon, "List")
    })
  })

  //Buying Description
  describe("Buying", async ()=>{
    let transaction
    
    beforeEach(async () =>{
      //list an item
      transaction = await dappazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait()
      //buy an item
      transaction = await dappazon.connect(buyer).buy(ID, {value: COST})
    })
    it("Updates buyer's order count", async ()=>{
      const result = await dappazon.orderCount(buyer.address);
      expect(result.toNumber()).to.equal(1)
    })
    it("Add the order", async ()=>{
      const order = await dappazon.orders(buyer.address, 1)

      expect(order.time).to.be.greaterThan(0)
      expect(order.item.name).to.equal(NAME)
    })
    it("Updates the contract balance", async ()=>{
      const result = await ethers.provider.getBalance(dappazon.address)
      expect(ethers.utils.formatUnits(result, 'ether')).to.equal(ethers.utils.formatUnits(COST, 'ether'))
    })
    it("Emit Buy event", ()=>{
      expect(transaction).to.emit(dappazon, "Buy");
    })
  })

  //Withdrawing description
  describe("Withdrawing", ()=>{
    let balanceBefore

    beforeEach(async ()=>{
      //list a item
      let transaction = await dappazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait()

      //buy a item
      transaction = await dappazon.connect(buyer).buy(ID, {value: COST})
      await transaction.wait()

      //get Deployer balance before
      balanceBefore = await ethers.provider.getBalance(deployer.address)

      //withdraw
      transaction = await dappazon.connect(deployer).withdraw()
      await transaction.wait()
    })
    it('Updates the owner balance', async ()=>{
      const balanceAfter = await ethers.provider.getBalance(deployer.address)
      expect(balanceAfter).to.be.greaterThan(balanceBefore)
    })
    it('Updates the contract balance', async ()=>{
      const result = await ethers.provider.getBalance(dappazon.address)
      expect(result).to.equal(0)
    })
  })
})
