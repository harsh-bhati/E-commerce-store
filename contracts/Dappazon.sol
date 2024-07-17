// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Dappazon {
    string public name;
    address public owner;
    
    struct Item{
        uint256 id;
        string name;
        string category;
        string image;
        uint256 cost;
        uint256 rating;
        uint256 stock;
    }

    struct Order{
        uint256 time;
        Item item;
    }

    mapping(uint256 => Item) public items;
    mapping(address => mapping(uint256=> Order)) public orders;//total orders by that buyer
    mapping(address => uint256) public orderCount;//the number count of this order

    event List(string name, uint256 cost, uint256 quantity);
    event Buy(address buyer, uint256 orderId, uint256 itemId);

    modifier onlyOwner(){
        require(msg.sender == owner);
        _;
    }
    constructor(){
        name = "Dappazon";
        owner = msg.sender;
    }

    //List products
    function list(uint256 _id, string memory _name, string memory _category, string memory _image, uint256 _cost, uint256 _rating, uint256 _stock) public onlyOwner {
        //create item struct
        Item memory item = Item(_id, _name, _category, _image, _cost, _rating, _stock);
        
        //save item struct to blockchain
        items[_id] = item;
        
        //emit an event
        emit List(_name, _cost, _stock);
    }

    //buy products
    function buy(uint256 _id) public payable{
        //receive crypto : done by payable modifier

        //we need to fetch item from blockchain, before creating the followin order
        Item memory item = items[_id];

        //require enough ether to buy item
        require(msg.value >= item.cost);

        //require items is in stock
        require(item.stock > 0);

        //create order
        Order memory order = Order(block.timestamp, item);

        //save order to chain
        orderCount[msg.sender]++;//order ID
        orders[msg.sender][orderCount[msg.sender]] = order;
        
        //subtract stock
        items[_id].stock = item.stock -1;

        //emit event
        emit Buy(msg.sender, orderCount[msg.sender], item.id);
    }

    //owner withdrawing money from contract
    function withdraw() public onlyOwner{
        (bool success, ) = owner.call{value:address(this).balance}("");
        require(success);
    }
}
